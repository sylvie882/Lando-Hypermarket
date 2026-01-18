'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function DeliveryAuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // Skip auth check for login page
      if (pathname === '/delivery/login') {
        setIsAuthenticated(true); // Allow access to login page
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('delivery_token');
      const user = localStorage.getItem('delivery_user');
      
      if (!token || !user) {
        router.push('/delivery/login');
        return false;
      }
      
      try {
        JSON.parse(user);
        setIsAuthenticated(true);
      } catch (error) {
        router.push('/delivery/login');
        return false;
      }
      
      return true;
    };
    
    setLoading(false);
    if (!checkAuth()) {
      setTimeout(() => {
        if (!checkAuth()) {
          router.push('/delivery/login');
        }
      }, 100);
    }
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}