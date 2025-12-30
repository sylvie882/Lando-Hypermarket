// app/layout.tsx - UPDATED WITH FAVICON AND METADATA
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/lib/query';
import { Toaster } from 'react-hot-toast';
import AuthSync from '@/components/auth/AuthSync';

const inter = Inter({ subsets: ['latin'] });

// Viewport configuration for mobile responsiveness
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#16a34a', // Green color matching your brand
};

// Metadata configuration
export const metadata: Metadata = {
  title: {
    default: 'Lando Ranch - Fresh Produce Delivery',
    template: '%s | Lando Ranch'
  },
  description: 'Farm-fresh vegetables, fruits, and groceries delivered to your doorstep in Kenya. Order online for quick delivery.',
  keywords: [
    'lando ranch',
    'fresh produce',
    'vegetables delivery',
    'fruits delivery',
    'groceries delivery',
    'kenya groceries',
    'farm fresh',
    'organic produce',
    'online supermarket',
    'food delivery'
  ],
  authors: [{ name: 'Lando Ranch' }],
  creator: 'Lando Ranch',
  publisher: 'Lando Ranch',
  formatDetection: {
    email: true,
    address: false,
    telephone: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  
  // Open Graph for social media
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: '/',
    title: 'Lando Ranch - Fresh Produce Delivery',
    description: 'Farm-fresh vegetables, fruits, and groceries delivered to your doorstep in Kenya.',
    siteName: 'Lando Ranch',
    images: [
      {
        url: '/logo.jpeg',
        width: 1200,
        height: 630,
        alt: 'Lando Ranch - Fresh Produce Delivery',
      },
    ],
  },
  
  // Twitter Cards
  twitter: {
    card: 'summary_large_image',
    title: 'Lando Ranch - Fresh Produce Delivery',
    description: 'Farm-fresh vegetables, fruits, and groceries delivered to your doorstep in Kenya.',
    images: ['/logo.jpeg'],
    creator: '@landoranch',
  },
  
  // Robots for SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Icons configuration - using your logo.jpeg
  icons: {
    icon: [
      { url: '/favicon.ico' }, // Fallback
      { url: '/logo.jpeg', sizes: 'any' }, // Your logo as icon
    ],
    shortcut: ['/logo.jpeg'],
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/logo.jpeg', sizes: '180x180', type: 'image/jpeg' },
    ],
  },
  
  // Additional metadata
  category: 'E-commerce',
  verification: {
    // Add Google Search Console verification if needed
    // google: 'verification_token',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon links for different browsers */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.jpeg" type="image/jpeg" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.jpeg" />
        
        {/* Manifest for PWA (optional) */}
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Additional meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Lando Ranch" />
        <meta name="application-name" content="Lando Ranch" />
        <meta name="mobile-web-app-capable" content="yes" />
        
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
              <AuthSync /> {/* Add this line */}
            <Toaster 
              position="top-right" 
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#16a34a',
                  },
                },
                error: {
                  duration: 4000,
                  style: {
                    background: '#dc2626',
                  },
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}