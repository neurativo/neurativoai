import { NextRequest } from 'next/server';
import WebSocket, { WebSocketServer } from 'ws';

// Store active connections
const activeConnections = new Map<string, {
  clientWs: WebSocket;
  openaiWs: WebSocket | null;
  isConnected: boolean;
}>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  // Create a WebSocket server for this connection
  const wss = new WebSocketServer({ noServer: true });
  
  return new Promise<Response>((resolve) => {
    wss.on('connection', (clientWs: WebSocket) => {
      console.log(`Client ${clientId} connected to proxy`);
      
      let openaiWs: WebSocket | null = null;
      let isConnected = false;

      // Store connection info
      activeConnections.set(clientId, {
        clientWs,
        openaiWs: null,
        isConnected: false
      });

      // Connect to OpenAI Realtime API
      const connectToOpenAI = () => {
        try {
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            console.error('OpenAI API key not configured');
            clientWs.send(JSON.stringify({
              type: 'error',
              error: 'OpenAI API key not configured'
            }));
            return;
          }

          console.log(`Connecting client ${clientId} to OpenAI Realtime API...`);
          
          openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17', {
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          });

          openaiWs.on('open', () => {
            console.log(`Client ${clientId} connected to OpenAI Realtime API`);
            isConnected = true;
            
            // Update connection status
            const conn = activeConnections.get(clientId);
            if (conn) {
              conn.openaiWs = openaiWs;
              conn.isConnected = true;
            }

            // Send initial configuration to OpenAI
            const config = {
              type: 'session.update',
              session: {
                modalities: ['audio'],
                instructions: `You are a real-time transcription assistant for live lectures. Your job is to:

1. Transcribe speech accurately in real-time
2. Remove filler words like "um", "ah", "like", "you know"
3. Add proper punctuation and sentence casing
4. Ignore background noise and irrelevant chatter
5. Focus on educational content and academic terminology
6. Output clean, readable text suitable for note-taking

Guidelines:
- Be concise but accurate
- Use proper academic formatting
- Maintain context across long lectures
- Handle technical terms and formulas correctly
- Provide clean, professional transcriptions`,
                voice: 'alloy',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 500
                },
                tools: [],
                tool_choice: 'auto',
                temperature: 0.1,
                max_response_output_tokens: 4096
              }
            };

            openaiWs!.send(JSON.stringify(config));
            console.log(`Configuration sent to OpenAI for client ${clientId}`);
          });

          openaiWs.on('message', (data: WebSocket.Data) => {
            try {
              const message = JSON.parse(data.toString());
              console.log(`OpenAI message for client ${clientId}:`, message.type);
              
              // Forward OpenAI messages to client
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify(message));
              }
            } catch (error) {
              console.error(`Error parsing OpenAI message for client ${clientId}:`, error);
            }
          });

          openaiWs.on('error', (error) => {
            console.error(`OpenAI WebSocket error for client ${clientId}:`, error);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'error',
                error: `OpenAI connection error: ${error.message}`
              }));
            }
          });

          openaiWs.on('close', (code, reason) => {
            console.log(`OpenAI WebSocket closed for client ${clientId}: ${code} ${reason}`);
            isConnected = false;
            
            // Update connection status
            const conn = activeConnections.get(clientId);
            if (conn) {
              conn.isConnected = false;
            }

            // Attempt reconnection after a delay
            setTimeout(() => {
              if (clientWs.readyState === WebSocket.OPEN) {
                console.log(`Attempting to reconnect client ${clientId} to OpenAI...`);
                connectToOpenAI();
              }
            }, 2000);
          });

        } catch (error) {
          console.error(`Error connecting client ${clientId} to OpenAI:`, error);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'error',
              error: `Failed to connect to OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`
            }));
          }
        }
      };

      // Handle messages from client
      clientWs.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'input_audio_buffer.append' && openaiWs && isConnected) {
            // Forward audio data to OpenAI
            openaiWs.send(JSON.stringify(message));
            console.log(`Audio chunk forwarded for client ${clientId}: ${message.audio?.length || 0} chars`);
          } else if (message.type === 'session.close') {
            // Handle session close
            if (openaiWs) {
              openaiWs.send(JSON.stringify(message));
            }
          } else {
            // Forward other messages to OpenAI
            if (openaiWs && isConnected) {
              openaiWs.send(JSON.stringify(message));
            }
          }
        } catch (error) {
          console.error(`Error handling client message for ${clientId}:`, error);
        }
      });

      // Handle client disconnect
      clientWs.on('close', () => {
        console.log(`Client ${clientId} disconnected from proxy`);
        
        // Close OpenAI connection
        if (openaiWs) {
          openaiWs.close();
        }
        
        // Remove from active connections
        activeConnections.delete(clientId);
      });

      clientWs.on('error', (error) => {
        console.error(`Client WebSocket error for ${clientId}:`, error);
      });

      // Start connection to OpenAI
      connectToOpenAI();
    });

    // Handle the upgrade request
    const response = new Response(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Protocol': 'realtime'
      }
    });

    resolve(response);
  });
}

// Cleanup function for graceful shutdown
export async function POST(request: NextRequest) {
  const { action } = await request.json();
  
  if (action === 'cleanup') {
    console.log('Cleaning up WebSocket connections...');
    
    for (const [clientId, connection] of activeConnections) {
      if (connection.openaiWs) {
        connection.openaiWs.close();
      }
      if (connection.clientWs) {
        connection.clientWs.close();
      }
    }
    
    activeConnections.clear();
    
    return new Response(JSON.stringify({ success: true, message: 'All connections cleaned up' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

