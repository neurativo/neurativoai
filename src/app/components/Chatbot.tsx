"use client";
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m Neurativo\'s AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render markdown-like formatting
  const renderFormattedContent = (content: string) => {
    // Split content into lines for processing
    const lines = content.split('\n');
    const elements: React.JSX.Element[] = [];
    let listItems: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
            {listItems.map((item, index) => (
              <li key={index} className="text-sm">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-gray-800/50 p-3 rounded-lg my-2 overflow-x-auto">
            <code className="text-xs text-gray-300">{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      }
    };

    lines.forEach((line, index) => {
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
        } else {
          flushList();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Handle headers
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-sm font-semibold text-white mt-3 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
        return;
      }

      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-base font-bold text-white mt-4 mb-2">
            {line.replace('## ', '')}
          </h2>
        );
        return;
      }

      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={index} className="text-lg font-bold text-white mt-4 mb-3">
            {line.replace('# ', '')}
          </h1>
        );
        return;
      }

      // Handle list items
      if (line.startsWith('- ')) {
        listItems.push(line.replace('- ', ''));
        return;
      }

      // Handle bold text
      if (line.includes('**')) {
        flushList();
        const parts = line.split('**');
        const formattedLine = parts.map((part, i) => 
          i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part
        );
        elements.push(
          <p key={index} className="text-sm my-1">
            {formattedLine}
          </p>
        );
        return;
      }

      // Handle links
      if (line.includes('(/')) {
        flushList();
        const linkRegex = /\[([^\]]+)\]\(\/([^)]+)\)/g;
        const formattedLine = line.replace(linkRegex, (match, text, path) => {
          return `<a href="/${path}" class="text-blue-300 hover:text-blue-200 underline">${text}</a>`;
        });
        elements.push(
          <p key={index} className="text-sm my-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
        return;
      }

      // Handle empty lines
      if (line.trim() === '') {
        flushList();
        elements.push(<br key={index} />);
        return;
      }

      // Regular text
      flushList();
      elements.push(
        <p key={index} className="text-sm my-1">
          {line}
        </p>
      );
    });

    // Flush any remaining lists or code blocks
    flushList();
    flushCodeBlock();

    return elements;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hi! I\'m Neurativo\'s AI assistant. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };

  const quickQuestions = [
    'How do I create a quiz?',
    'What is Live Lecture?',
    'How much does it cost?',
    'How do I use Study Pack?',
    'What features are available?',
    'How do I upgrade my plan?',
    'Troubleshooting help',
    'What subjects are supported?'
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        aria-label="Open AI Assistant"
      >
        <i className="fas fa-robot text-white text-xl group-hover:animate-pulse" />
        {!isOpen && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed bottom-24 right-6 z-50 w-80 h-96 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-robot text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Neurativo AI</h3>
                  <p className="text-gray-300 text-xs">Online now</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearChat}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Clear chat"
                >
                  <i className="fas fa-trash text-xs" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Close chat"
                >
                  <i className="fas fa-times text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white/10 text-gray-100 border border-white/10'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="text-sm leading-relaxed">
                      {renderFormattedContent(message.content)}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-gray-100 border border-white/10 p-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-white/10">
              <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
              <div className="space-y-1">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="block w-full text-left text-xs text-gray-300 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <i className="fas fa-paper-plane text-xs" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
