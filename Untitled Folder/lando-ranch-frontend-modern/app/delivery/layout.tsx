'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Allow login page without auth
    if (pathname === '/delivery/login') { setReady(true); return; }

    const token = localStorage.getItem('delivery_token');
    const user  = localStorage.getItem('delivery_user');

    if (!token || !user) { router.push('/delivery/login'); return; }

    try {
      JSON.parse(user);
      setReady(true);
    } catch {
      router.push('/delivery/login');
    }
  }, [pathname, router]);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl animate-pulse"
        style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
        🚚
      </div>
    </div>
  );

  return <>{children}</>;
}