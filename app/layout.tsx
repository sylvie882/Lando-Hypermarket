// app/layout.tsx - UPDATED WITH GOOGLE VERIFICATION
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
const BUSINESS_PHONE = '+254 711 223344';
const BUSINESS_EMAIL = 'info@hypermarket.co.ke';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#10b981',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Hypermarket Kenya | Shop Online & Save More Now — Online Exclusive Deals Up To 30% Off*',
  description: 'Shop Now & Save More On All Your Favourite Products. Get your first three orders within 60-90 mins for express delivery on the Hypermarket App. Cash On Delivery Available. Free delivery in Nairobi for orders above Ksh 2,000.',
  keywords: [
    'Hypermarket Kenya',
    'online grocery shopping Kenya',
    'buy groceries online Nairobi',
    'fresh vegetables delivery Nairobi',
    'fruits delivery Kenya',
    'grocery delivery Nairobi',
    'online supermarket Kenya',
    'food delivery Nairobi',
    'Nairobi grocery store',
    'Kenya ecommerce',
    'fresh tomatoes delivery',
    'potatoes Nairobi',
    'onions online',
    'bananas delivery',
    'milk delivery Nairobi',
    'eggs delivery',
    'same day delivery Nairobi',
    'free delivery groceries',
    'online shopping Kenya',
    'grocery app Kenya',
    'food shopping online',
    'shop online Kenya',
    'save more Kenya',
    'online deals Kenya',
    '30% off groceries',
    'express delivery Nairobi',
    'cash on delivery Nairobi',
    'online exclusive deals'
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
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: SITE_URL,
    title: 'Hypermarket Kenya | Shop Online & Save More Now — Online Exclusive Deals Up To 30% Off*',
    description: 'Shop Now & Save More On All Your Favourite Products. Get your first three orders within 60-90 mins for express delivery on the Hypermarket App. Cash On Delivery Available.',
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Hypermarket Kenya - Shop Online & Save More Now',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hypermarket Kenya | Shop Online & Save More Now',
    description: 'Online Exclusive Deals Up To 30% Off* Shop Now & Save More On All Your Favourite Products. Express delivery in 60-90 mins.',
    images: [`${SITE_URL}/images/twitter-card.jpg`],
    creator: '@hypermarket_ke',
    site: '@hypermarket_ke',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  category: 'E-commerce & Grocery',
  applicationName: SITE_NAME,
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
        {/* GOOGLE SITE VERIFICATION - CRITICAL */}
        <meta name="google-site-verification" content="5696457e6978be87" />
        
        {/* Additional meta tags for better visibility */}
        <meta name="description" content="Shop Online & Save More Now — Online Exclusive Deals Up To 30% Off* Shop Now & Save more On All your Favourite Products. Get your first three orders within 60-90 mins for express delivery on the Hypermarket App. Cash On Delivery. Free delivery in Nairobi for orders above Ksh 2,000." />
        
        {/* hreflang tags */}
        <link rel="alternate" href={SITE_URL} hrefLang="en-ke" />
        <link rel="alternate" href={SITE_URL} hrefLang="en" />
        <link rel="alternate" href={SITE_URL} hrefLang="x-default" />
        
        {/* Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.hypermarket.co.ke" />
        
        {/* Structured Data */}
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
                "image": `${SITE_URL}/logo.jpeg`,
                "description": "Shop Online & Save More Now — Online Exclusive Deals Up To 30% Off* Shop Now & Save more On All your Favourite Products. Get your first three orders within 60-90 mins for express delivery",
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
                },
                "offers": {
                  "@type": "Offer",
                  "name": "Online Exclusive Deals Up To 30% Off",
                  "description": "Save more on all your favourite products with online exclusive deals",
                  "availability": "https://schema.org/InStock"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                "url": SITE_URL,
                "name": "Hypermarket Kenya",
                "description": "Shop Online & Save More Now — Online Exclusive Deals Up To 30% Off*",
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
                  "name": "Online Deals",
                  "item": `${SITE_URL}/deals`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Up To 30% Off",
                  "item": `${SITE_URL}/deals/30-off`
                }
              ]
            })
          }}
        />
        
        {/* Favicon - Updated to use PNG */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Mobile meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Hypermarket" />
        <meta name="format-detection" content="telephone=yes" />
        
        {/* Additional promotional meta */}
        <meta name="promotion" content="Online Exclusive Deals Up To 30% Off" />
        <meta name="offer" content="Save more on all your favourite products" />
        <meta name="delivery" content="Express delivery within 60-90 minutes" />
        <meta name="payment" content="Cash On Delivery Available" />
        
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
        
        {/* Google Analytics - Optional */}
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