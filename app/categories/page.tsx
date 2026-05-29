// app/categories/page.tsx
// Server component wrapper — adds metadata + JSON-LD for the /categories listing page.
// The CategoriesPageClient below contains your existing UI, 100% unchanged.

import type { Metadata } from 'next';
import CategoriesPageClient from '././Categoriespageclient';

const SITE_URL = 'https://hypermarket.co.ke';
const SITE_NAME = 'Lando Hypermarket';

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Shop by Category | Fresh Produce, Meat, Eggs & More | Lando Hypermarket',
  description:
    'Browse all product categories at Lando Hypermarket — fresh vegetables, pasture raised meat (goat, sheep, rabbit), kienyeji eggs, dairy, baby products, cleaning supplies, stationery, samosas, handicrafts & more. Express delivery across Nairobi.',
  keywords: [
    'grocery categories Nairobi',
    'online supermarket categories Kenya',
    'fresh produce categories',
    'meat eggs dairy Nairobi delivery',
    'baby products cleaning supplies Kenya',
    'stationery handicrafts Nairobi',
    'Lando Hypermarket categories',
    'shop online Nairobi categories',
  ],
  alternates: {
    canonical: `${SITE_URL}/categories`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/categories`,
    siteName: SITE_NAME,
    locale: 'en_KE',
    title: 'Shop by Category | Lando Hypermarket Nairobi',
    description:
      'All product categories — fresh vegetables, pasture raised meat, kienyeji eggs, dairy, baby products, cleaning supplies, samosas, handicrafts & more. Express delivery Nairobi.',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Lando Hypermarket — Browse All Categories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop by Category | Lando Hypermarket Nairobi',
    description: 'Fresh vegetables, pasture raised meat, kienyeji eggs, dairy, baby products & more. Express delivery Nairobi.',
    images: [`${SITE_URL}/twitter-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories` },
    ],
  };

  const jsonLdCollectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/categories#collection`,
    name: 'Product Categories — Lando Hypermarket',
    description:
      'Browse all categories at Lando Hypermarket: fresh vegetables, pasture raised meat, kienyeji eggs, dairy, baby products, cleaning supplies, stationery, samosas, handicrafts, beverages, and more.',
    url: `${SITE_URL}/categories`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };

  return (
    <>
      {/* Inline schema — in raw HTML, seen by Googlebot before JS runs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollectionPage) }}
      />

      {/*
        Visually hidden H1 for crawlers.
        The hero section in CategoriesPageClient has its own visible heading;
        this ensures there's exactly one H1 in the DOM for SEO purposes.
        Remove sr-only if you want this visible instead of the hero text.
      */}
      <h1 className="sr-only">
        Shop by Category — Fresh Produce, Pasture Raised Meat, Kienyeji Eggs &amp; More | Lando Hypermarket Nairobi
      </h1>

      {/* Existing categories UI — no changes */}
      <CategoriesPageClient />
    </>
  );
}