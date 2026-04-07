// app/layout.tsx - ENHANCED SEO & PERFORMANCE
import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientLayout from './ClientLayout';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/lib/query';
import { Toaster } from 'react-hot-toast';
import AuthSync from '@/components/auth/AuthSync';
import OpeningSoonSuspense from '@/components/suspense/OpeningSoonSuspense';
import Script from 'next/script';

const SITE_URL = 'https://hypermarket.co.ke';
const SITE_NAME = 'Lando Hypermarket';
const BUSINESS_PHONE = '+254 716 354 589';
const BUSINESS_EMAIL = 'landoranchh@gmail.com';
const BUSINESS_WHATSAPP = '+254716354589';
const BUSINESS_INSTAGRAM = 'landoranch_ke';
const BUSINESS_FACEBOOK = 'landoranch';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1d2ae7ff',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Lando Hypermarket | Fresh Vegetables, Pasture Raised Meat, Kienyeji Eggs, Baby Products & More',
    template: '%s | Lando Hypermarket'
  },
  description: 'Shop Lando Hypermarket for fresh farm produce: pasture raised meat (goat, sheep, rabbit), kienyeji eggs, fresh vegetables, tropical fruits, dairy products, baby essentials, stationery, cleaning supplies, wooden utensils, samosas, and traditional handicrafts. Everything you need and love. Amazing products, quickly delivered in 99 minutes at every day prices. Free delivery Nairobi. Order now!',
  keywords: [
    // ============================================
    // FRESH PRODUCE CATEGORIES
    // ============================================
    
    // Fresh Vegetables (Category ID: 46, 62)
    'fresh vegetables Nairobi',
    'organic vegetables Kenya',
    'traditional vegetables online',
    'leafy greens delivery',
    'fresh vegetables delivery',
    'farm fresh vegetables',
    'vegetable delivery Nairobi',
    'green groceries online',
    
    // Leafy Greens (Category ID: 54)
    'sukuma wiki delivery',
    'managu online',
    'terere vegetables',
    'kunde leaves',
    'cassava leaves',
    'saget delivery',
    'pumpkin leaves',
    'osuga vegetable',
    'mrenda Kenya',
    'spinach delivery',
    'kale Nairobi',
    'cabbage online',
    
    // Root Vegetables (Category ID: 53)
    'root vegetables Nairobi',
    'potatoes delivery',
    'carrots online',
    'onions delivery',
    'garlic Kenya',
    'ginger online',
    'arrow roots delivery',
    'sweet potatoes Nairobi',
    'cassava fresh',
    'yams Kenya',
    
    // Pre-Cut Vegetables (Category ID: 40)
    'chopped vegetables delivery',
    'pre-cut vegetables Nairobi',
    'prepared vegetables online',
    'ready to cook vegetables',
    'mixed vegetables chopped',
    
    // Fresh Fruits (Category ID: 27, 45)
    'fresh fruits Nairobi',
    'tropical fruits Kenya',
    'mangoes delivery',
    'oranges online',
    'bananas delivery',
    'avocados Nairobi',
    'passion fruit Kenya',
    'pineapple fresh',
    'watermelon delivery',
    
    // Tropical Fruits (Category ID: 55)
    'exotic fruits Kenya',
    'local fruits Nairobi',
    'tree tomatoes',
    'loquats',
    'soursop',
    
    // Mango Varieties (Category ID: 27)
    'apple mangoes',
    'ngowe mangoes',
    'kent mangoes',
    'fresh mango delivery',
    
    // ============================================
    // MEAT & ANIMAL PRODUCTS
    // ============================================
    
    // Pasture Raised Meat (Category ID: 31)
    'pasture raised meat Kenya',
    'goat meat Nairobi',
    'sheep meat delivery',
    'rabbit meat Kenya',
    'grass fed meat',
    'organic meat Nairobi',
    'fresh goat meat',
    'mutton delivery',
    'rabbit meat online',
    
    // Meat & Animal Products (Category ID: 48)
    'fresh meat delivery',
    'animal products Kenya',
    'farm fresh meat',
    'quality meat Nairobi',
    
    // Poultry & Eggs (Category ID: 57)
    'fresh chicken delivery',
    'turkey meat Nairobi',
    'duck meat Kenya',
    'whole chicken',
    'chicken parts',
    'poultry products',
    
    // Pasture Raised Eggs (Kienyeji) (Category ID: 71)
    'kienyeji eggs Nairobi',
    'pasture raised eggs',
    'free range eggs Kenya',
    'brown eggs delivery',
    'farm fresh eggs',
    'eggs kienyeji near me',
    'organic eggs Nairobi',
    'traditional eggs',
    'village eggs',
    
    // ============================================
    // FISH & SEAFOOD (Category ID: 32, 52)
    // ============================================
    
    'fresh fish delivery Nairobi',
    'tilapia online',
    'omena delivery',
    'seafood Kenya',
    'freshwater fish',
    'fried fish',
    'fish fillets',
    
    // ============================================
    // DAIRY PRODUCTS
    // ============================================
    
    // Dairy Products (Category ID: 56)
    'fresh milk delivery',
    'yogurt Nairobi',
    'cheese Kenya',
    'butter delivery',
    'fermented milk',
    'mursik online',
    'fresh cream',
    
    // Milk Products (Category ID: 66, 67, 68, 69)
    'cow milk delivery',
    'fresh cow milk',
    'goat milk Nairobi',
    'camel milk Kenya',
    'raw milk delivery',
    'pasteurized milk',
    'premium milk',
    
    // ============================================
    // CEREALS, GRAINS & LEGUMES
    // ============================================
    
    // Cereals & Grains (Category ID: 34)
    'cereals Kenya',
    'grains online',
    'flour delivery Nairobi',
    'breakfast cereals',
    
    // Grains & Flours (Category ID: 50)
    'maize flour',
    'wheat flour',
    'rice delivery',
    'cooking flour',
    'baking supplies',
    
    // Legumes & Beans (Category ID: 47)
    'beans Kenya',
    'lentils online',
    'green grams',
    'ndengu delivery',
    'peas Nairobi',
    'legumes online',
    'kidney beans',
    'black beans',
    
    // ============================================
    // NUTS, SEEDS & DRIED FRUITS (Category ID: 49)
    // ============================================
    
    'nuts Kenya',
    'seeds online',
    'dried fruits Nairobi',
    'groundnuts delivery',
    'cashew nuts',
    'macadamia Kenya',
    'pumpkin seeds',
    'sunflower seeds',
    'raisins online',
    'dates delivery',
    
    // ============================================
    // HERBS, SPICES & SEASONINGS
    // ============================================
    
    // Herbs & Spices (Category ID: 51)
    'fresh herbs Nairobi',
    'spices Kenya',
    'coriander delivery',
    'mint leaves',
    'rosemary fresh',
    'thyme online',
    'bay leaves',
    'curry powder',
    'turmeric fresh',
    
    // Masala Spices (Category ID: 58)
    'masala online',
    'garam masala',
    'spice mix Kenya',
    'traditional spices',
    
    // Mixed Spices (Category ID: 59)
    'mixed spices Nairobi',
    'all purpose seasoning',
    'blended spices',
    
    // Seasonings (Category ID: 60)
    'seasoning Kenya',
    'salt online',
    'pepper delivery',
    'seasoning mixes',
    
    // ============================================
    // BABY PRODUCTS (Category ID: 70)
    // ============================================
    
    'baby products Kenya',
    'baby diapers delivery',
    'baby formula Nairobi',
    'baby food online',
    'baby wipes Kenya',
    'baby care essentials',
    'newborn items',
    'baby lotion',
    'baby shampoo',
    'feeding bottles',
    'baby accessories',
    
    // ============================================
    // HOUSEHOLD & CLEANING
    // ============================================
    
    // Cleaning Supplies & Equipment (Category ID: 73)
    'cleaning supplies Nairobi',
    'professional cleaning products',
    'detergent delivery',
    'cleaning equipment Kenya',
    'hygiene products',
    'disinfectants online',
    'floor cleaner',
    'glass cleaner',
    'cleaning tools',
    'mops and brooms',
    'cleaning chemicals',
    'commercial cleaning supplies',
    
    // ============================================
    // HANDICRAFTS & ARTISANS (Category ID: 42)
    // ============================================
    
    'handicrafts Kenya',
    'traditional crafts',
    'kenyan artisans',
    'traditional utensils',
    'african crafts',
    'decorative items',
    'cultural items',
    'handmade Kenya',
    'local crafts',
    
    // Wooden Utensils (Category ID: 63, 64, 65)
    'wooden utensils Kenya',
    'wooden spoons',
    'cooking utensils wooden',
    'eating utensils',
    'serving ware Kenya',
    'wooden bowls',
    'wooden plates',
    'traditional wooden items',
    'hand carved wood',
    'sustainable kitchenware',
    
    // ============================================
    // STATIONERY (Category ID: 72)
    // ============================================
    
    'stationery Kenya',
    'office supplies Nairobi',
    'school supplies',
    'pens online',
    'exercise books',
    'printing paper',
    'envelopes delivery',
    'art supplies',
    'craft materials',
    'notebooks',
    'folders and files',
    
    // ============================================
    // BEVERAGES (Category ID: 39)
    // ============================================
    
    'beverages Kenya',
    'juices delivery Nairobi',
    'soft drinks online',
    'water delivery',
    'energy drinks',
    'fresh juice',
    'traditional drinks',
    'healthy beverages',
    
    // ============================================
    // SNACKS & READY TO EAT
    // ============================================
    
    // Samosas (Category ID: 74)
    'samosas Nairobi',
    'fresh samosas delivery',
    'beef samosas',
    'chicken samosas',
    'vegetable samosas',
    'kenyan snacks',
    'pastries online',
    'ready to eat snacks',
    
    // ============================================
    // FRESH FLOWERS & PLANTS (Category ID: 43)
    // ============================================
    
    'fresh flowers Nairobi',
    'flower delivery Kenya',
    'decorative plants',
    'bouquets online',
    'indoor plants',
    'garden plants',
    
    // ============================================
    // LOCATION-BASED SEARCHES
    // ============================================
    
    'supermarket in Nairobi',
    'grocery delivery Westlands',
    'shop online Kilimani',
    'groceries Lavington',
    'delivery Kileleshwa',
    'supermarket Karen',
    'online shopping Langata',
    'grocery store Parklands',
    'food delivery Nairobi CBD',
    'groceries South B',
    'supermarket South C',
    'delivery Buruburu',
    'online grocery Donholm',
    'shop Umoja',
    'delivery Eastlands',
    
    // ============================================
    // SERVICE KEYWORDS
    // ============================================
    
    'same day delivery Nairobi',
    'express grocery delivery',
    'free delivery Nairobi',
    'cash on delivery Kenya',
    'M-Pesa payment online',
    'order groceries online',
    'home delivery Kenya',
    '24 hour delivery Nairobi',
    'grocery app Kenya',
    
    // ============================================
    // GENERAL GROCERY TERMS
    // ============================================
    
    'online supermarket Kenya',
    'grocery delivery Nairobi',
    'buy food online Kenya',
    'shop for groceries',
    'daily essentials',
    'household items',
    'kitchen essentials',
    'pantry staples',
    'bulk groceries',
    
    // ============================================
    // KENYAN MARKET TERMS
    // ============================================
    
    'mboga online',
    'nyama delivery',
    'maharagwe online',
    'unga delivery',
    'mafuta ya kupikia',
    'samli',
    'bidii products'
  ],
  authors: [{ name: 'Lando Hypermarket', url: 'https://hypermarket.co.ke/about' }],
  creator: 'Lando Hypermarket',
  publisher: 'Lando Hypermarket',
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
    title: 'Lando Hypermarket | Fresh Vegetables, Pasture Raised Meat, Kienyeji Eggs & Baby Products',
    description: '🛒 Shop online: Fresh vegetables • Pasture raised meat (goat, sheep, rabbit) • Kienyeji eggs • Dairy • Baby products • Stationery • Cleaning supplies • Wooden utensils • Samosas • Handicrafts. Free delivery Nairobi over KES 2000!',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Lando Hypermarket - Online Supermarket for Fresh Produce, Meat, Eggs & Household Essentials',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@landohypermarket_ke',
    creator: '@landohypermarket_ke',
    title: 'Lando Hypermarket | Fresh Farm Produce & Groceries Delivered',
    description: 'Farm fresh vegetables, pasture raised meat, kienyeji eggs, baby products & more. Free delivery Nairobi over KES 2000.',
    images: [`${SITE_URL}/twitter-image.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-KE': SITE_URL,
      'sw-KE': `${SITE_URL}/sw`,
    },
  },
  category: 'grocery',
  classification: 'Online Supermarket',
  verification: {
    google: '5696457e6978be87',
    other: {
      'facebook-domain-verification': ['your-fb-verification-code'],
    },
  },
  other: {
    'geo.region': 'KE-30',
    'geo.placename': 'Nairobi',
    'geo.position': '-1.286389;36.817223',
    'ICBM': '-1.286389, 36.817223',
    'og:email': BUSINESS_EMAIL,
    'og:phone_number': BUSINESS_PHONE,
    'og:country-name': 'Kenya',
    'business:contact_data:street_address': 'Nairobi, Kenya',
    'business:contact_data:locality': 'Nairobi',
    'business:contact_data:country': 'KE',
    'category:vegetables': 'Fresh Vegetables, Leafy Greens, Root Vegetables, Pre-Cut Vegetables',
    'category:meat': 'Pasture Raised Meat (Goat, Sheep, Rabbit), Poultry',
    'category:eggs': 'Pasture Raised Eggs (Kienyeji), Free Range Eggs',
    'category:dairy': 'Cow Milk, Goat Milk, Camel Milk, Yogurt, Cheese',
    'category:produce': 'Fresh Fruits, Tropical Fruits, Mango Varieties',
    'category:grains': 'Cereals, Grains, Flours, Legumes, Beans',
    'category:spices': 'Herbs, Spices, Masala, Seasonings',
    'category:baby': 'Baby Products, Diapers, Formula, Baby Care',
    'category:cleaning': 'Cleaning Supplies, Equipment, Chemicals',
    'category:handicrafts': 'Wooden Utensils, Traditional Crafts, Serving Ware',
    'category:stationery': 'Office Supplies, School Supplies, Art Materials',
    'category:snacks': 'Samosas, Pastries, Ready to Eat',
    'category:beverages': 'Juices, Drinks, Water',
    'category:flowers': 'Fresh Flowers, Plants'
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
        <meta name="description" content="✓ Fresh Vegetables • Pasture Raised Meat (Goat, Sheep, Rabbit) • Kienyeji Eggs • Fresh Fruits • Dairy • Baby Products • Stationery • Cleaning Supplies • Wooden Utensils • Samosas • Handicrafts. Free delivery Nairobi over KES 2000. Order online now!" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={SITE_URL} />
        
        {/* hreflang tags */}
        <link rel="alternate" href={SITE_URL} hrefLang="en-KE" />
        <link rel="alternate" href={`${SITE_URL}/sw`} hrefLang="sw-KE" />
        <link rel="alternate" href={SITE_URL} hrefLang="x-default" />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.lando.co.ke" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Favicon & Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#004E9A" />
        <meta name="theme-color" content="#004E9A" />
        
        {/* Mobile App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hypermarket" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Category & Service Tags */}
        <meta name="service-type" content="Grocery Delivery" />
        <meta name="delivery-areas" content="Nairobi, Kiambu, Westlands, Kilimani, Lavington, Kileleshwa, Karen, Langata, Parklands, South B, South C, Buruburu, Donholm, Umoja, Eastlands" />
        <meta name="payment-methods" content="M-Pesa, Cash on Delivery, Credit Card, Debit Card" />
        <meta name="delivery-time" content="45-99 minutes" />
        <meta name="free-delivery-threshold" content="KES 2000" />
        
        {/* Product Categories Meta */}
        <meta name="products" content="Fresh Vegetables, Leafy Greens, Root Vegetables, Pre-Cut Vegetables, Fresh Fruits, Tropical Fruits, Mangoes, Pasture Raised Meat (Goat, Sheep, Rabbit), Poultry, Kienyeji Eggs, Fresh Fish, Dairy Products, Cow Milk, Goat Milk, Camel Milk, Cereals, Grains, Flours, Legumes, Beans, Nuts, Seeds, Herbs, Spices, Masala, Baby Products, Diapers, Cleaning Supplies, Equipment, Handicrafts, Wooden Utensils, Stationery, Samosas, Beverages, Fresh Flowers" />
        
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
              "logo": `${SITE_URL}/logo10.png`,
              "image": `${SITE_URL}/og-image.jpg`,
              "description": "Kenya's premier online supermarket offering fresh vegetables, pasture raised meat, kienyeji eggs, baby products, stationery, cleaning supplies, wooden utensils, samosas, handicrafts, and household essentials with express delivery in Nairobi.",
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
                },
                {
                  "@type": "ContactPoint",
                  "telephone": BUSINESS_WHATSAPP,
                  "contactType": "whatsapp",
                  "availableLanguage": ["English", "Swahili"]
                }
              ],
              "sameAs": [
                `https://www.facebook.com/${BUSINESS_FACEBOOK}`,
                `https://www.instagram.com/${BUSINESS_INSTAGRAM}`,
                `https://twitter.com/${BUSINESS_INSTAGRAM}`
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
              "name": "Lando Hypermarket",
              "image": `${SITE_URL}/store-image.jpg`,
              "url": SITE_URL,
              "telephone": BUSINESS_PHONE,
              "email": BUSINESS_EMAIL,
              "priceRange": "KES 20 - KES 5000",
              "menu": `${SITE_URL}/products`,
              "acceptsReservations": "False",
              "servesCuisine": "Groceries, Fresh Produce, Meat, Dairy, Traditional Foods",
              "areaServed": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                  "@type": "GeoCoordinates",
                  "latitude": -1.286389,
                  "longitude": 36.817223
                },
                "geoRadius": "30000"
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
                    "name": "Fresh Vegetables",
                    "itemListElement": [
                      {"@type": "Product", "name": "Leafy Greens (Sukuma Wiki, Managu, Terere, Kunde)"},
                      {"@type": "Product", "name": "Root Vegetables (Potatoes, Carrots, Onions, Arrow Roots)"},
                      {"@type": "Product", "name": "Pre-Cut Vegetables"},
                      {"@type": "Product", "name": "Traditional Vegetables"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Fresh Fruits",
                    "itemListElement": [
                      {"@type": "Product", "name": "Mangoes (Apple, Ngowe, Kent)"},
                      {"@type": "Product", "name": "Tropical Fruits"},
                      {"@type": "Product", "name": "Citrus Fruits"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Pasture Raised Meat",
                    "itemListElement": [
                      {"@type": "Product", "name": "Goat Meat"},
                      {"@type": "Product", "name": "Sheep Meat (Mutton)"},
                      {"@type": "Product", "name": "Rabbit Meat"},
                      {"@type": "Product", "name": "Grass Fed Meat"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Poultry & Eggs",
                    "itemListElement": [
                      {"@type": "Product", "name": "Kienyeji Eggs (Pasture Raised)"},
                      {"@type": "Product", "name": "Free Range Eggs"},
                      {"@type": "Product", "name": "Fresh Chicken"},
                      {"@type": "Product", "name": "Turkey & Duck"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Dairy Products",
                    "itemListElement": [
                      {"@type": "Product", "name": "Fresh Cow Milk"},
                      {"@type": "Product", "name": "Goat Milk"},
                      {"@type": "Product", "name": "Camel Milk"},
                      {"@type": "Product", "name": "Yogurt & Mursik"},
                      {"@type": "Product", "name": "Cheese & Butter"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Fish & Seafood",
                    "itemListElement": [
                      {"@type": "Product", "name": "Fresh Tilapia"},
                      {"@type": "Product", "name": "Omena"},
                      {"@type": "Product", "name": "Fish Fillets"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Cereals & Grains",
                    "itemListElement": [
                      {"@type": "Product", "name": "Maize Flour"},
                      {"@type": "Product", "name": "Rice"},
                      {"@type": "Product", "name": "Wheat Flour"},
                      {"@type": "Product", "name": "Breakfast Cereals"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Legumes & Beans",
                    "itemListElement": [
                      {"@type": "Product", "name": "Beans (Various Types)"},
                      {"@type": "Product", "name": "Lentils"},
                      {"@type": "Product", "name": "Green Grams (Ndengu)"},
                      {"@type": "Product", "name": "Peas"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Nuts, Seeds & Dried Fruits",
                    "itemListElement": [
                      {"@type": "Product", "name": "Groundnuts"},
                      {"@type": "Product", "name": "Cashew Nuts"},
                      {"@type": "Product", "name": "Macadamia"},
                      {"@type": "Product", "name": "Pumpkin Seeds"},
                      {"@type": "Product", "name": "Dates & Raisins"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Herbs, Spices & Seasonings",
                    "itemListElement": [
                      {"@type": "Product", "name": "Fresh Herbs"},
                      {"@type": "Product", "name": "Masala Spices"},
                      {"@type": "Product", "name": "Mixed Spices"},
                      {"@type": "Product", "name": "Seasonings"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Baby Products",
                    "itemListElement": [
                      {"@type": "Product", "name": "Baby Diapers"},
                      {"@type": "Product", "name": "Baby Formula"},
                      {"@type": "Product", "name": "Baby Food"},
                      {"@type": "Product", "name": "Baby Wipes"},
                      {"@type": "Product", "name": "Baby Care Essentials"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Cleaning Supplies & Equipment",
                    "itemListElement": [
                      {"@type": "Product", "name": "Detergents"},
                      {"@type": "Product", "name": "Disinfectants"},
                      {"@type": "Product", "name": "Cleaning Tools"},
                      {"@type": "Product", "name": "Professional Cleaning Supplies"},
                      {"@type": "Product", "name": "Hygiene Products"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Handicrafts & Artisans",
                    "itemListElement": [
                      {"@type": "Product", "name": "Wooden Utensils"},
                      {"@type": "Product", "name": "Eating & Cooking Utensils"},
                      {"@type": "Product", "name": "Serving Ware"},
                      {"@type": "Product", "name": "Traditional Crafts"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Stationery",
                    "itemListElement": [
                      {"@type": "Product", "name": "Office Supplies"},
                      {"@type": "Product", "name": "School Supplies"},
                      {"@type": "Product", "name": "Art Materials"},
                      {"@type": "Product", "name": "Pens & Notebooks"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Samosas & Snacks",
                    "itemListElement": [
                      {"@type": "Product", "name": "Beef Samosas"},
                      {"@type": "Product", "name": "Chicken Samosas"},
                      {"@type": "Product", "name": "Vegetable Samosas"},
                      {"@type": "Product", "name": "Fresh Pastries"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Beverages",
                    "itemListElement": [
                      {"@type": "Product", "name": "Fresh Juices"},
                      {"@type": "Product", "name": "Soft Drinks"},
                      {"@type": "Product", "name": "Drinking Water"},
                      {"@type": "Product", "name": "Energy Drinks"}
                    ]
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Fresh Flowers & Plants",
                    "itemListElement": [
                      {"@type": "Product", "name": "Fresh Flowers"},
                      {"@type": "Product", "name": "Decorative Plants"},
                      {"@type": "Product", "name": "Bouquets"}
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
              "description": "Online supermarket in Nairobi offering fresh vegetables, pasture raised meat, kienyeji eggs, dairy, baby products, stationery, cleaning supplies, wooden utensils, samosas, handicrafts, and household essentials with express delivery.",
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
              "name": "Lando Hypermarket",
              "image": `${SITE_URL}/store-front.jpg`,
              "url": SITE_URL,
              "telephone": BUSINESS_PHONE,
              "priceRange": "KES 20 - 5000",
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
                    "name": "Fresh Vegetables",
                    "description": "Locally sourced fresh vegetables including leafy greens and root vegetables"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Product",
                    "name": "Pasture Raised Meat",
                    "description": "Goat, sheep, and rabbit meat from grass-fed animals"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Product",
                    "name": "Kienyeji Eggs",
                    "description": "Fresh pasture raised eggs from free-range chickens"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Product",
                    "name": "Fresh Fruits",
                    "description": "Farm fresh fruits including mango varieties and tropical fruits"
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
                  "name": "Fresh Vegetables",
                  "item": `${SITE_URL}/category/vegetables`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Pasture Raised Meat",
                  "item": `${SITE_URL}/category/livestock-1`
                },
                {
                  "@type": "ListItem",
                  "position": 4,
                  "name": "Kienyeji Eggs",
                  "item": `${SITE_URL}/category/egg`
                },
                {
                  "@type": "ListItem",
                  "position": 5,
                  "name": "Fresh Fruits",
                  "item": `${SITE_URL}/category/fruits`
                },
                {
                  "@type": "ListItem",
                  "position": 6,
                  "name": "Dairy Products",
                  "item": `${SITE_URL}/category/dairy-products`
                },
                {
                  "@type": "ListItem",
                  "position": 7,
                  "name": "Baby Products",
                  "item": `${SITE_URL}/category/baby-products`
                },
                {
                  "@type": "ListItem",
                  "position": 8,
                  "name": "Cleaning Supplies",
                  "item": `${SITE_URL}/category/cleaning-materials-equipment`
                },
                {
                  "@type": "ListItem",
                  "position": 9,
                  "name": "Handicrafts",
                  "item": `${SITE_URL}/category/handicrafts-1`
                },
                {
                  "@type": "ListItem",
                  "position": 10,
                  "name": "Stationery",
                  "item": `${SITE_URL}/category/stationery`
                },
                {
                  "@type": "ListItem",
                  "position": 11,
                  "name": "Samosas",
                  "item": `${SITE_URL}/category/samosas`
                }
              ]
            })
          }}
        />
        
        {/* Product Category Schema */}
        <Script
          id="schema-itemlist"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "item": {
                    "@type": "Product",
                    "name": "Fresh Vegetables",
                    "description": "Fresh vegetables including leafy greens, root vegetables, and traditional varieties",
                    "url": `${SITE_URL}/category/vegetables`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "item": {
                    "@type": "Product",
                    "name": "Pasture Raised Meat",
                    "description": "Goat, sheep, and rabbit meat from grass-fed animals",
                    "url": `${SITE_URL}/category/livestock-1`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "item": {
                    "@type": "Product",
                    "name": "Kienyeji Eggs",
                    "description": "Fresh pasture raised eggs from free-range chickens",
                    "url": `${SITE_URL}/category/egg`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 4,
                  "item": {
                    "@type": "Product",
                    "name": "Fresh Fruits",
                    "description": "Farm fresh fruits including mangoes and tropical varieties",
                    "url": `${SITE_URL}/category/fruits`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 5,
                  "item": {
                    "@type": "Product",
                    "name": "Dairy Products",
                    "description": "Fresh cow milk, goat milk, camel milk, yogurt, and cheese",
                    "url": `${SITE_URL}/category/dairy-products`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 6,
                  "item": {
                    "@type": "Product",
                    "name": "Fish & Seafood",
                    "description": "Fresh tilapia, omena, and seafood",
                    "url": `${SITE_URL}/category/fish-seafood`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 7,
                  "item": {
                    "@type": "Product",
                    "name": "Cereals & Grains",
                    "description": "Maize flour, rice, wheat flour, and breakfast cereals",
                    "url": `${SITE_URL}/category/grains-flour-1`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 8,
                  "item": {
                    "@type": "Product",
                    "name": "Legumes & Beans",
                    "description": "Beans, lentils, green grams, and peas",
                    "url": `${SITE_URL}/category/legumes-beans`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 9,
                  "item": {
                    "@type": "Product",
                    "name": "Herbs & Spices",
                    "description": "Fresh herbs, masala spices, and seasonings",
                    "url": `${SITE_URL}/category/herbs-spices`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 10,
                  "item": {
                    "@type": "Product",
                    "name": "Baby Products",
                    "description": "Diapers, formula, baby food, and care essentials",
                    "url": `${SITE_URL}/category/baby-products`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 11,
                  "item": {
                    "@type": "Product",
                    "name": "Cleaning Supplies",
                    "description": "Detergents, disinfectants, cleaning tools, and equipment",
                    "url": `${SITE_URL}/category/cleaning-materials-equipment`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 12,
                  "item": {
                    "@type": "Product",
                    "name": "Wooden Utensils",
                    "description": "Handcrafted wooden eating and cooking utensils",
                    "url": `${SITE_URL}/category/wooden-utensils`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 13,
                  "item": {
                    "@type": "Product",
                    "name": "Stationery",
                    "description": "Office and school supplies, art materials",
                    "url": `${SITE_URL}/category/stationery`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 14,
                  "item": {
                    "@type": "Product",
                    "name": "Samosas",
                    "description": "Fresh beef, chicken, and vegetable samosas",
                    "url": `${SITE_URL}/category/samosas`
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 15,
                  "item": {
                    "@type": "Product",
                    "name": "Fresh Flowers",
                    "description": "Fresh flowers and decorative plants",
                    "url": `${SITE_URL}/category/flowers-1`
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className="font-sans antialiased">
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
                    background: '#2546dbff',
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
        
        {/* Structured data for products - This will help with rich snippets */}
        <Script id="structured-data-products" strategy="afterInteractive">
          {`
            // This can be enhanced to dynamically pull product data
            // For now, it's a template
            window.productData = window.productData || [];
          `}
        </Script>
      </body>
    </html>
  );
}