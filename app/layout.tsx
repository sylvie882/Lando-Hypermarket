// app/layout.tsx - UPDATED WITH SUSPENSE COMPONENT AND ENHANCED SEO
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/lib/query';
import { Toaster } from 'react-hot-toast';
import AuthSync from '@/components/auth/AuthSync';
import OpeningSoonSuspense from '@/components/suspense/OpeningSoonSuspense';

const inter = Inter({ subsets: ['latin'] });

// Viewport configuration for mobile responsiveness
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#16a34a',
};

// Enhanced Metadata for better SEO ranking
export const metadata: Metadata = {
  title: {
    default: 'Lando Ranch - Fresh Produce & Grocery Delivery in Kenya',
    template: '%s | Lando Ranch - Farm Fresh Delivery'
  },
  description: 'OPENING SOON AT YOUR NEIGHBOURHOOD! Fresh vegetables, fruits, dairy, and groceries delivered to your doorstep in Kenya. Order online for same-day delivery. Partner with us today!',
  keywords: [
    'lando ranch',
    'fresh produce delivery kenya',
    'vegetables delivery nairobi',
    'fruits delivery kenya',
    'online grocery shopping kenya',
    'farm fresh produce',
    'organic vegetables kenya',
    'grocery delivery service',
    'kenya online supermarket',
    'fresh food delivery',
    'opening soon',
    'neighbourhood delivery',
    'food partnership kenya',
    'grocery business opportunity'
  ],
  authors: [{ name: 'Lando Ranch' }],
  creator: 'Lando Ranch',
  publisher: 'Lando Ranch',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://landoranch.co.ke'),
  alternates: {
    canonical: '/',
  },
  
  // Enhanced Open Graph with better CTAs
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: '/',
    title: 'COMING SOON: Lando Ranch - Fresh Produce Delivery in Your Neighbourhood',
    description: 'OPENING SOON AT YOUR NEIGHBOURHOOD! Be the first to experience farm-fresh vegetables, fruits, and groceries delivered to your doorstep. Partner with us!',
    siteName: 'Lando Ranch',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Lando Ranch Opening Soon - Fresh Produce Delivery',
      },
    ],
  },
  
  // Enhanced Twitter Cards
  twitter: {
    card: 'summary_large_image',
    title: 'Lando Ranch - Opening Soon in Your Neighbourhood!',
    description: 'Fresh vegetables, fruits & groceries delivered to your doorstep. Partner with us for exclusive early access!',
    images: ['/twitter-image.jpg'],
    creator: '@landoranch',
    site: '@landoranch',
  },
  
  // Enhanced Robots configuration
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
      noimageindex: false,
    },
  },
  
  // Icons
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
  
  // Additional SEO metadata
  category: 'E-commerce | Food Delivery | Groceries',
  applicationName: 'Lando Ranch',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  
  // Structured data hints
  other: {
    'facebook-domain-verification': process.env.FB_DOMAIN_VERIFICATION || '',
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
        
        {/* Favicon links */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Additional meta tags for SEO */}
        <meta name="google-site-verification" content={process.env.GOOGLE_SITE_VERIFICATION || ''} />
        <meta name="msvalidate.01" content={process.env.BING_SITE_VERIFICATION || ''} />
        
        {/* Apple meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Lando Ranch" />
        
        {/* Mobile web app */}
        <meta name="application-name" content="Lando Ranch" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Structured Data for Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "GroceryStore",
              "name": "Lando Ranch",
              "description": "Opening soon - Fresh produce and grocery delivery service in Kenya",
              "url": "https://landoranch.co.ke",
              "logo": "https://landoranch.co.ke/logo.jpeg",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "Kenya"
              },
              "openingHours": "Mo-Su 07:00-21:00",
              "serviceArea": "Nairobi and surrounding areas",
              "sameAs": [
                "https://facebook.com/landoranch",
                "https://twitter.com/landoranch",
                "https://instagram.com/landoranch"
              ]
            })
          }}
        />
        
        {/* Facebook Pixel (optional) */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.FACEBOOK_PIXEL_ID || ''}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${process.env.FACEBOOK_PIXEL_ID || ''}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <ClientLayout>
              {/* Opening Soon Suspense Component - Shows immediately on website entry */}
              <OpeningSoonSuspense />
              {children}
            </ClientLayout>
            <AuthSync />
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