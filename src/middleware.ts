import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function middleware(request: NextRequest) {
  // Skip maintenance check for admin routes and API routes
  if (request.nextUrl.pathname.startsWith('/admin') || 
      request.nextUrl.pathname.startsWith('/api')) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Check maintenance mode
  try {
    const supabase = getSupabaseServer()
    
    const { data: maintenanceMode } = await supabase
      .from('maintenance_mode')
      .select('is_enabled, message, allowed_ips')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (maintenanceMode?.is_enabled) {
      // Check if user's IP is in allowed list
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'

      const allowedIPs = maintenanceMode.allowed_ips || []
      if (!allowedIPs.includes(clientIP)) {
        return new NextResponse(
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Maintenance - Neurativo</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
              }
              .container {
                text-align: center;
                max-width: 600px;
                padding: 2rem;
              }
              .logo {
                font-size: 3rem;
                font-weight: bold;
                margin-bottom: 1rem;
              }
              .title {
                font-size: 2rem;
                margin-bottom: 1rem;
              }
              .message {
                font-size: 1.2rem;
                opacity: 0.9;
                margin-bottom: 2rem;
                line-height: 1.6;
              }
              .spinner {
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top: 4px solid white;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 2rem;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .footer {
                margin-top: 3rem;
                opacity: 0.7;
                font-size: 0.9rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">🧠</div>
              <h1 class="title">We're Upgrading!</h1>
              <div class="spinner"></div>
              <p class="message">${maintenanceMode.message || 'We are currently performing scheduled maintenance to improve your experience. Please check back soon.'}</p>
              <div class="footer">
                <p>Thank you for your patience!</p>
                <p>Neurativo Team</p>
              </div>
            </div>
          </body>
          </html>`,
          {
            status: 503,
            headers: {
              'Content-Type': 'text/html',
              'Retry-After': '3600',
            },
          }
        )
      }
    }
  } catch (error) {
    console.error('Maintenance mode check failed:', error)
  }

  return addSecurityHeaders(NextResponse.next())
}

function addSecurityHeaders(response: NextResponse) {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CSP header for additional security
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.assemblyai.com https://api.deepgram.com;"
  )
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}