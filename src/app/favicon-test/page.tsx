export default function FaviconTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Favicon Test Page</h1>
        <p className="text-xl mb-8">Check if your favicon is working correctly</p>
        <div className="space-y-4">
          <p>✅ If you see your custom favicon in the browser tab, it's working!</p>
          <p>❌ If you still see the Vercel triangle, try these steps:</p>
          <ol className="text-left max-w-md mx-auto space-y-2">
            <li>1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)</li>
            <li>2. Clear browser cache completely</li>
            <li>3. Try in incognito/private mode</li>
            <li>4. Wait 5-10 minutes for Vercel cache to clear</li>
          </ol>
          <div className="mt-8">
            <a 
              href="/" 
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Go Back Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
