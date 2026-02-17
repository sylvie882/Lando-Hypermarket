// app/layout.tsx - COMPREHENSIVE SEO OPTIMIZATION
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
  title: {
    default: 'Hypermarket Kenya | Farm Fresh Groceries & Organic Products Delivered in Nairobi',
    template: '%s | Hypermarket Kenya'
  },
  description: 'Kenya\'s fastest growing online supermarket. Shop farm fresh vegetables, organic fruits, baby products, maternity essentials & household items. Free delivery in Nairobi over KES 2000. Order now in 45-99 mins!',
  keywords: [
    // Primary keywords
    'online supermarket Kenya',
    'grocery delivery Nairobi',
    'farm fresh vegetables Kenya',
    'organic products Nairobi',
    'buy groceries online Kenya',
    
    // Product categories
    'fresh vegetables delivery',
    'organic fruits Kenya',
    'baby products Nairobi',
    'maternity pads Kenya',
    'cleaning supplies Nairobi',
    'stationery online Kenya',
    
    // Location-based
    'supermarket in Nairobi',
    'food delivery Westlands',
    'groceries Kilimani',
    'online shopping Lavington',
    
    // Service keywords
    'same day delivery Nairobi',
    'cash on delivery groceries',
    'M-Pesa online payment',
    'express grocery delivery',
    
    // Long-tail keywords
    'where to buy organic vegetables in Nairobi',
    'best online grocery store Kenya',
    'affordable baby diapers delivery',
    'fresh produce home delivery'
  ],
  authors: [{ name: 'Hypermarket Kenya', url: 'https://hypermarket.co.ke/about' }],
  creator: 'Hypermarket Kenya',
  publisher: 'Hypermarket Kenya',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
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
    siteName: SITE_NAME,
    title: 'Hypermarket Kenya - Your Everyday Online Supermarket in Nairobi',
    description: '🛒 Farm fresh produce • Organic products • Baby essentials • Maternity supplies • Cleaning items. Free delivery over KES 2000. Shop now!',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Hypermarket Kenya - Online Grocery Shopping',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@hypermarket_ke',
    creator: '@hypermarket_ke',
    title: 'Hypermarket Kenya | Online Grocery Delivery',
    description: 'Farm fresh groceries delivered to your doorstep in Nairobi. Shop vegetables, fruits, baby products & more!',
    images: [`${SITE_URL}/twitter-image.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-KE': SITE_URL,
    },
  },
  category: 'grocery',
  classification: 'Online Supermarket',
  verification: {
    google: '5696457e6978be87', // Your Google Search Console verification
    other: {
      'facebook-domain-verification': ['your-fb-verification-code'],
    },
  },
  other: {
    'geo.region': 'KE-30', // Nairobi county code
    'geo.placename': 'Nairobi',
    'geo.position': '-1.286389;36.817223',
    'ICBM': '-1.286389, 36.817223',
    'og:email': BUSINESS_EMAIL,
    'og:phone_number': BUSINESS_PHONE,
    'og:country-name': 'Kenya',
    'business:contact_data:street_address': 'Nairobi, Kenya',
    'business:contact_data:locality': 'Nairobi',
    'business:contact_data:country': 'KE',
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
        {/* Essential Meta Tags */}
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="5696457e6978be87" />
        
        {/* Enhanced Description with Rich Snippets */}
        <meta name="description" content="✓ Fresh vegetables ✓ Organic fruits ✓ Baby products ✓ Maternity supplies ✓ Cleaning items. Free delivery Nairobi over KES 2000. Order online now!" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={SITE_URL} />
        
        {/* hreflang tags */}
        <link rel="alternate" href={SITE_URL} hrefLang="en-KE" />
        <link rel="alternate" href={SITE_URL} hrefLang="en" />
        <link rel="alternate" href={SITE_URL} hrefLang="x-default" />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.hypermarket.co.ke" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Favicon & Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="theme-color" content="#10b981" />
        
        {/* Mobile App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hypermarket" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Category & Service Tags */}
        <meta name="service-type" content="Grocery Delivery" />
        <meta name="delivery-areas" content="Nairobi, Kiambu, Westlands, Kilimani, Lavington, Kileleshwa" />
        <meta name="payment-methods" content="M-Pesa, Cash on Delivery, Credit Card, Debit Card" />
        <meta name="delivery-time" content="45-99 minutes" />
        <meta name="free-delivery-threshold" content="KES 2000" />
        
        {/* Comprehensive Schema.org Structured Data */}
        <Script
          id="schema-organization"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              "name": SITE_NAME,
              "url": SITE_URL,
              "logo": `${SITE_URL}/logo.png`,
              "image": `${SITE_URL}/og-image.jpg`,
              "description": "Kenya's premier online supermarket offering farm fresh groceries, organic products, baby essentials, and household items with express delivery in Nairobi.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Nairobi",
                "addressRegion": "Nairobi",
                "addressCountry": "KE"
              },
              "contactPoint": [
                {
                  "@type": "ContactPoint",
                  "telephone": BUSINESS_PHONE,
                  "contactType": "customer service",
                  "availableLanguage": ["English", "Swahili"],
                  "hoursAvailable": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "08:00",
                    "closes": "20:00"
                  }
                },
                {
                  "@type": "ContactPoint",
                  "telephone": BUSINESS_PHONE,
                  "contactType": "sales",
                  "availableLanguage": ["English", "Swahili"]
                }
              ],
              "sameAs": [
                "https://www.facebook.com/hypermarketkenya",
                "https://www.instagram.com/hypermarket_ke",
                "https://twitter.com/hypermarket_ke"
              ]
            })
          }}
        />
        
        <Script
          id="schema-grocery-store"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "GroceryStore",
              "@id": `${SITE_URL}/#store`,
              "name": "Hypermarket Kenya",
              "image": `${SITE_URL}/store-image.jpg`,
              "url": SITE_URL,
              "telephone": BUSINESS_PHONE,
              "email": BUSINESS_EMAIL,
              "priceRange": "$$",
              "menu": `${SITE_URL}/products`,
              "acceptsReservations": "False",
              "servesCuisine": "Groceries, Fresh Produce, Organic Foods",
              "areaServed": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                  "@type": "GeoCoordinates",
                  "latitude": -1.286389,
                  "longitude": 36.817223
                },
                "geoRadius": "20000"
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
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Product Categories",
                "itemListElement": [
                  {
                    "@type": "OfferCatalog",
                    "name": "Farm Fresh",
                    "itemListElement": [
                      {"@type": "Product", "name": "Fresh Vegetables"},
                      {"@type": "Product", "name": "Fresh Fruits"},
                      {"@type": "Product", "name": "Fresh Herbs"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Organic Products",
                    "itemListElement": [
                      {"@type": "Product", "name": "Organic Vegetables"},
                      {"@type": "Product", "name": "Organic Fruits"},
                      {"@type": "Product", "name": "Organic Grains"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Baby Products",
                    "itemListElement": [
                      {"@type": "Product", "name": "Baby Diapers"},
                      {"@type": "Product", "name": "Baby Formula"},
                      {"@type": "Product", "name": "Baby Food"}
                    ]
                  }
                ]
              }
            })
          }}
        />
        
        <Script
          id="schema-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              "url": SITE_URL,
              "name": SITE_NAME,
              "description": "Online supermarket in Nairobi offering farm fresh groceries, organic products, baby essentials, and household items with express delivery.",
              "publisher": {
                "@id": `${SITE_URL}/#organization`
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${SITE_URL}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        
        <Script
          id="schema-local-business"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": `${SITE_URL}/#localbusiness`,
              "name": "Hypermarket Kenya",
              "image": `${SITE_URL}/store-front.jpg`,
              "url": SITE_URL,
              "telephone": BUSINESS_PHONE,
              "priceRange": "KES 50 - 5000",
              "openingHours": "Mo-Sa 08:00-20:00, Su 09:00-18:00",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Nairobi",
                "addressCountry": "KE"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -1.286389,
                "longitude": 36.817223
              },
              "areaServed": "Nairobi, Kenya",
              "makesOffer": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Grocery Delivery",
                    "description": "Express grocery delivery in 45-99 minutes"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Product",
                    "name": "Farm Fresh Vegetables",
                    "description": "Locally sourced fresh vegetables"
                  }
                }
              ]
            })
          }}
        />
        
        <Script
          id="schema-breadcrumb"
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
                },
                {
                  "@type": "ListItem",
                  "position": 5,
                  "name": "Maternity",
                  "item": `${SITE_URL}/maternity`
                },
                {
                  "@type": "ListItem",
                  "position": 6,
                  "name": "Cleaning Supplies",
                  "item": `${SITE_URL}/cleaning-supplies`
                }
              ]
            })
          }}
        />
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
        
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX', {
              'send_page_view': true,
              'transport_type': 'beacon',
              'anonymize_ip': true
            });
          `}
        </Script>
        
        {/* Facebook Pixel */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', 'YOUR_PIXEL_ID');
            fbq('track', 'PageView');
          `}
        </Script>
      </body>
    </html>
  );
}