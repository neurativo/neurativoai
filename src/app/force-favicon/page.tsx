export default function ForceFavicon() {
  return (
    <html>
      <head>
        <title>Force Favicon Test</title>
        <link rel="icon" href="/favicon1.ico" />
        <link rel="shortcut icon" href="/favicon1.ico" />
        <meta httpEquiv="refresh" content="3;url=/" />
      </head>
      <body style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        margin: 0,
        textAlign: 'center'
      }}>
        <div>
          <h1>🔄 Forcing Favicon Update...</h1>
          <p>Check your browser tab - you should see your custom favicon!</p>
          <p>Redirecting to home page in 3 seconds...</p>
          <div style={{ marginTop: '20px' }}>
            <a href="/" style={{ 
              color: 'white', 
              textDecoration: 'underline',
              fontSize: '18px'
            }}>
              Go to Home Page Now
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
