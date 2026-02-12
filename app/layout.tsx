// app/layout.tsx - UPDATED WITH COMPREHENSIVE PRODUCT RANGE
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
  title: 'Hypermarket Kenya | Farm Fresh & Organic Groceries, Baby Products, Maternity & More — Shop Online & Save',
  description: 'Your one-stop online grocery store in Kenya. Shop farm fresh vegetables & fruits, organic products, stationery, maternity pads, baby products, cleaning supplies & more. Express delivery in Nairobi. Cash on Delivery available.',
  keywords: [
    // Core grocery keywords
    'Hypermarket Kenya',
    'online grocery shopping Kenya',
    'buy groceries online Nairobi',
    'grocery delivery Nairobi',
    'online supermarket Kenya',
    'farm fresh products Kenya',
    'organic products Nairobi',
    'fresh vegetables delivery Nairobi',
    'fruits delivery Kenya',
    
    // Additional product categories
    'stationery supplies Nairobi',
    'buy stationery online Kenya',
    'maternity pads Kenya',
    'baby products Nairobi',
    'baby diapers delivery',
    'baby formula Kenya',
    'baby wipes online',
    'cleaning products Kenya',
    'household cleaning supplies Nairobi',
    'dish soap delivery',
    'laundry detergent Kenya',
    'organic vegetables Nairobi',
    'organic fruits Kenya',
    'pesticide free vegetables',
    'chemical free produce',
    
    // Existing keywords preserved
    'food delivery Nairobi',
    'Nairobi grocery store',
    'Kenya ecommerce',
    'same day delivery Nairobi',
    'free delivery groceries',
    'online shopping Kenya',
    'grocery app Kenya',
    'cash on delivery Nairobi',
    'express delivery Nairobi'
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
    title: 'Hypermarket Kenya | Farm Fresh & Organic Groceries, Baby Products, Maternity & More',
    description: 'Your one-stop online grocery store: Farm fresh produce, organic products, stationery, maternity pads, baby essentials, cleaning supplies. Express delivery Nairobi. Shop now & save!',
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Hypermarket Kenya - Farm Fresh Groceries, Organic Products, Baby & Maternity Essentials',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hypermarket Kenya | Farm Fresh, Organic & Everyday Essentials',
    description: 'Farm fresh vegetables & fruits 🥬 | Organic products 🌱 | Baby & maternity 👶 | Stationery 📚 | Cleaning supplies 🧹 | Express delivery Nairobi',
    images: [`${SITE_URL}/images/twitter-card.jpg`],
    creator: '@hypermarket_ke',
    site: '@hypermarket_ke',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  category: 'Grocery & E-commerce',
  applicationName: SITE_NAME,
  other: {
    'geo.region': 'KE-NBO',
    'geo.placename': 'Nairobi',
    'geo.position': '-1.2921,36.8219',
    'ICBM': '-1.2921, 36.8219',
    
    // Additional product-focused meta tags
    'product-categories': 'Farm Fresh, Organic, Groceries, Stationery, Maternity, Baby Products, Cleaning Supplies',
    'delivery-area': 'Nairobi, Kenya',
    'payment-methods': 'Cash on Delivery, M-Pesa, Card Payments',
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
        
        {/* Enhanced description meta tag with full product range */}
        <meta name="description" content="🛒 Hypermarket Kenya: Your complete online grocery store. Shop farm fresh vegetables & fruits, certified organic products, office stationery, maternity pads, baby diapers & formula, household cleaning supplies. Express delivery within 60-90 mins in Nairobi. Free delivery for orders above Ksh 2,000. Cash on Delivery available." />
        
        {/* hreflang tags */}
        <link rel="alternate" href={SITE_URL} hrefLang="en-ke" />
        <link rel="alternate" href={SITE_URL} hrefLang="en" />
        <link rel="alternate" href={SITE_URL} hrefLang="x-default" />
        
        {/* Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.hypermarket.co.ke" />
        
        {/* Structured Data - Updated with comprehensive product offerings */}
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
                "description": "Online grocery store offering farm fresh produce, organic products, stationery, maternity supplies, baby products, and household cleaning essentials in Nairobi, Kenya.",
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
                "servesCuisine": [
                  "Fresh Produce", 
                  "Organic Products", 
                  "Groceries", 
                  "Dairy", 
                  "Beverages",
                  "Baby Products",
                  "Maternity Supplies",
                  "Stationery",
                  "Cleaning Products"
                ],
                "hasOfferCatalog": {
                  "@type": "OfferCatalog",
                  "name": "Product Categories",
                  "itemListElement": [
                    {
                      "@type": "OfferCatalog",
                      "name": "Farm Fresh",
                      "description": "Fresh vegetables and fruits sourced directly from farms"
                    },
                    {
                      "@type": "OfferCatalog",
                      "name": "Organic Products",
                      "description": "Certified organic vegetables, fruits, and groceries"
                    },
                    {
                      "@type": "OfferCatalog",
                      "name": "Baby Products",
                      "description": "Diapers, formula, baby food, wipes, and nursery essentials"
                    },
                    {
                      "@type": "OfferCatalog",
                      "name": "Maternity Supplies",
                      "description": "Maternity pads, nursing supplies, and postnatal care products"
                    },
                    {
                      "@type": "OfferCatalog",
                      "name": "Stationery",
                      "description": "Office supplies, school stationery, and writing materials"
                    },
                    {
                      "@type": "OfferCatalog",
                      "name": "Cleaning Supplies",
                      "description": "Household cleaning products, detergents, and sanitizers"
                    }
                  ]
                },
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
                  "name": "Online Exclusive Deals",
                  "description": "Save more on farm fresh produce, organic items, baby products, and everyday essentials",
                  "availability": "https://schema.org/InStock"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                "url": SITE_URL,
                "name": "Hypermarket Kenya",
                "description": "Farm fresh groceries, organic products, stationery, maternity supplies, baby essentials & cleaning products - all delivered to your door",
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
                  "name": "Farm Fresh",
                  "item": `${SITE_URL}/farm-fresh`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Organic Products",
                  "item": `${SITE_URL}/organic`
                },
                {
                  "@type": "ListItem",
                  "position": 4,
                  "name": "Baby Products",
                  "item": `${SITE_URL}/baby-products`
                }
              ]
            })
          }}
        />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Mobile meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Hypermarket" />
        <meta name="format-detection" content="telephone=yes" />
        
        {/* Enhanced promotional meta tags for all product categories */}
        <meta name="category-farm-fresh" content="Fresh vegetables, fruits, herbs from local farms" />
        <meta name="category-organic" content="Certified organic produce, pesticide-free vegetables, natural products" />
        <meta name="category-baby" content="Baby diapers, formula, baby food, wipes, nursery essentials" />
        <meta name="category-maternity" content="Maternity pads, nursing pads, postnatal care" />
        <meta name="category-stationery" content="Office stationery, school supplies, writing materials, notebooks" />
        <meta name="category-cleaning" content="Household cleaning products, dish soap, laundry detergent, sanitizers" />
        <meta name="delivery" content="Express delivery within 60-90 minutes in Nairobi" />
        <meta name="payment" content="Cash On Delivery, M-Pesa, Card Payments Available" />
        
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
        
        {/* Google Analytics */}
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