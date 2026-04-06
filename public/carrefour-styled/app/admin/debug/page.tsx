// app/login/debug/page.tsx
'use client';

import { useEffect } from 'react';

export default function LoginDebugPage() {
  useEffect(() => {
    console.log('🔍 Login Debug Page mounted');
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search:', window.location.search);
    
    // Check what login page should be used
    const pathname = window.location.pathname;
    
    if (pathname === '/login') {
      console.log('✅ This is the regular login page');
    } else if (pathname === '/admin/login') {
      console.log('⚠️ This is the admin login page');
      console.log('   Regular users should not see this!');
    }
    
    // Check if there's a redirect happening
    const checkRedirect = () => {
      console.log('   Checking for redirects...');
      
      // Look for any meta refresh or javascript redirects
      const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
      if (metaRefresh) {
        console.log('🚨 Meta refresh found:', metaRefresh.getAttribute('content'));
      }
      
      // Check if any script is doing redirect
      const scripts = document.querySelectorAll('script');
      scripts.forEach((script, i) => {
        if (script.textContent?.includes('location.href') || 
            script.textContent?.includes('window.location') ||
            script.textContent?.includes('router.push')) {
          console.log(`🚨 Script ${i} has redirect:`, script.textContent.substring(0, 100));
        }
      });
    };
    
    setTimeout(checkRedirect, 1000);
  }, []);

  const goToRegularLogin = () => {
    window.location.href = '/login';
  };

  const goToAdminLogin = () => {
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Login Debug Page</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="space-y-2">
            <p><strong>Path:</strong> {typeof window !== 'undefined' ? window.location.pathname : ''}</p>
            <p><strong>Search:</strong> {typeof window !== 'undefined' ? window.location.search : ''}</p>
            <p><strong>Hash:</strong> {typeof window !== 'undefined' ? window.location.hash : ''}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={goToRegularLogin}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Regular Login (/login)
          </button>
          
          <button
            onClick={goToAdminLogin}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Admin Login (/admin/login)
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Problem:</h3>
          <p className="text-yellow-700 mb-2">
            Regular users are seeing the admin login page instead of the regular login page.
          </p>
          <p className="text-yellow-700">
            This usually happens when there's a redirect in the middleware or a component.
          </p>
        </div>
      </div>
    </div>
  );
}