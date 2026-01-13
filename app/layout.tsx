// app/layout.tsx - FOR HYPERMARKET.CO.KE
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/lib/query';
import { Toaster } from 'react-hot-toast';
import AuthSync from '@/components/auth/AuthSync';
import OpeningSoonSuspense from '@/components/suspense/OpeningSoonSuspense';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = 'https://hypermarket.co.ke';
const SITE_NAME = 'Hypermarket Kenya';
const BUSINESS_PHONE = '+254 711 223344'; // Add your real phone
const BUSINESS_EMAIL = 'info@hypermarket.co.ke';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#10b981',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  
  // TITLE OPTIMIZATION
  title: {
    default: 'Hypermarket Kenya | Online Grocery Store - Fresh Food Delivery Nairobi',
    template: '%s | Hypermarket Kenya'
  },
  
  // DESCRIPTION OPTIMIZATION
  description: 'Buy fresh groceries, vegetables, fruits, dairy products online in Kenya. Free delivery in Nairobi for orders above Ksh 2,000. Same-day grocery delivery available.',
  
  // KEYWORDS BASED ON YOUR BUSINESS
  keywords: [
    // Primary keywords
    'Hypermarket Kenya',
    'online grocery shopping Kenya',
    'buy groceries online Nairobi',
    'fresh vegetables delivery Nairobi',
    'fruits delivery Kenya',
    
    // Location-based
    'grocery delivery Nairobi',
    'online supermarket Kenya',
    'food delivery Nairobi',
    'Nairobi grocery store',
    'Kenya ecommerce',
    
    // Product-specific
    'fresh tomatoes delivery',
    'potatoes Nairobi',
    'onions online',
    'bananas delivery',
    'milk delivery Nairobi',
    'eggs delivery',
    
    // Service keywords
    'same day delivery Nairobi',
    'free delivery groceries',
    'online shopping Kenya',
    'grocery app Kenya',
    'food shopping online'
  ],
  
  authors: [{ name: 'Hypermarket Kenya' }],
  creator: 'Hypermarket Kenya',
  publisher: 'Hypermarket Kenya',
  
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
  
  // OPEN GRAPH FOR SOCIAL SHARING
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: SITE_URL,
    title: 'Hypermarket Kenya - Online Grocery Delivery Service',
    description: 'Fresh groceries delivered to your doorstep in Nairobi. Order vegetables, fruits, dairy & household items online.',
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Hypermarket Kenya Online Grocery Store',
      },
    ],
  },
  
  // TWITTER CARDS
  twitter: {
    card: 'summary_large_image',
    title: 'Hypermarket Kenya | Online Grocery Store',
    description: 'Fresh food delivery in Nairobi. Order groceries online for same-day delivery.',
    images: [`${SITE_URL}/images/twitter-card.jpg`],
    creator: '@hypermarket_ke',
    site: '@hypermarket_ke',
  },
  
  // ICONS
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  
  // ADDITIONAL METADATA
  category: 'E-commerce & Grocery',
  applicationName: SITE_NAME,
  
  // LOCAL BUSINESS INFO
  other: {
    'geo.region': 'KE-NBO',
    'geo.placename': 'Nairobi',
    'geo.position': '-1.2921,36.8219',
    'ICBM': '-1.2921, 36.8219',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-KE">
      <head>
        {/* CRITICAL: hreflang tags for Kenyan market */}
        <link rel="alternate" href={SITE_URL} hrefLang="en-ke" />
        <link rel="alternate" href={SITE_URL} hrefLang="en" />
        <link rel="alternate" href={SITE_URL} hrefLang="x-default" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.hypermarket.co.ke" />
        
        {/* STRUCTURED DATA - CRITICAL FOR SEO */}
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "GroceryStore",
                "@id": `${SITE_URL}/#store`,
                "name": "Hypermarket Kenya",
                "image": `${SITE_URL}/logo.png`,
                "description": "Online grocery store offering fresh produce delivery in Nairobi, Kenya",
                "url": SITE_URL,
                "telephone": BUSINESS_PHONE,
                "email": BUSINESS_EMAIL,
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Nairobi",
                  "addressLocality": "Nairobi",
                  "addressRegion": "Nairobi County",
                  "postalCode": "00100",
                  "addressCountry": "KE"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": -1.2921,
                  "longitude": 36.8219
                },
                "openingHoursSpecification": [
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    "opens": "08:00",
                    "closes": "20:00"
                  },
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": "Sunday",
                    "opens": "09:00",
                    "closes": "18:00"
                  }
                ],
                "priceRange": "$$",
                "servesCuisine": ["Fresh Produce", "Groceries", "Dairy", "Beverages"],
                "areaServed": {
                  "@type": "GeoCircle",
                  "geoMidpoint": {
                    "@type": "GeoCoordinates",
                    "latitude": -1.2921,
                    "longitude": 36.8219
                  },
                  "geoRadius": "25000"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                "url": SITE_URL,
                "name": "Hypermarket Kenya",
                "description": "Online grocery delivery service in Kenya",
                "publisher": {
                  "@id": `${SITE_URL}/#store`
                }
              }
            ])
          }}
        />
        
        {/* Breadcrumb Schema */}
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": SITE_URL
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Groceries",
                  "item": `${SITE_URL}/groceries`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Fresh Produce",
                  "item": `${SITE_URL}/fresh-produce`
                }
              ]
            })
          }}
        />
        
        {/* Favicon links */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Mobile meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Hypermarket" />
        <meta name="format-detection" content="telephone=yes" />
        
        {/* Search Console Verification - ADD YOUR CODE */}
        <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE" />
        
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <ClientLayout>
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
                    background: '#10b981',
                  },
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
        
        {/* Analytics Script - Add Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </body>
    </html>
  );
}