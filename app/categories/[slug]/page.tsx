// app/categories/[slug]/page.tsx
// SERVER COMPONENT — enables generateMetadata + generateStaticParams for SEO

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryPageClient from '../CategoryPageClient';

const SITE_URL = 'https://hypermarket.co.ke';
const SITE_NAME = 'Lando Hypermarket';

// ─── helpers ────────────────────────────────────────────────────────────────

async function fetchAllCategories() {
  try {
    const res = await fetch('https://api.hypermarket.co.ke/api/categories', {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    return json.data || json || [];
  } catch {
    return [];
  }
}

async function getCategoryBySlug(slug: string) {
  const categories = await fetchAllCategories();
  return (
    categories.find((c: any) => c.slug === slug) ||
    categories.find((c: any) => c.id.toString() === slug) ||
    null
  );
}

// Per-category descriptions used for meta + SEO block
const CATEGORY_DESCRIPTIONS: Record<string, { short: string; long: string; features: string[] }> = {
  'fresh-vegetables': {
    short: 'Farm-fresh vegetables delivered to your door in Nairobi — leafy greens, root vegetables, pre-cut & traditional varieties.',
    long: 'Browse our wide selection of fresh vegetables sourced directly from Kenyan farms. From everyday sukuma wiki and spinach to traditional managu, terere, and kunde — all harvested and delivered the same day.',
    features: ['Sourced from local Kenyan farms', 'Harvested & delivered same day', 'Traditional & exotic varieties', 'Pre-cut options available'],
  },
  'fresh-fruits': {
    short: 'Tropical and seasonal fresh fruits delivered in Nairobi — mangoes, avocados, passion fruit, and more.',
    long: 'Shop premium fresh fruits including Kenyan mango varieties (Apple, Ngowe, Kent), avocados, watermelons, and exotic tropical fruits — all at everyday prices with express delivery.',
    features: ['Premium mango varieties', 'Tropical & seasonal picks', 'Farm-direct sourcing', 'Free delivery over KES 2000'],
  },
  'livestock-1': {
    short: 'Pasture raised goat, sheep, and rabbit meat delivered fresh in Nairobi. Grass-fed, ethically sourced.',
    long: 'Our pasture raised meat comes from animals that graze freely on open grassland. No hormones, no feedlots — just quality goat, sheep, and rabbit meat cut fresh to order.',
    features: ['100% grass-fed & pasture raised', 'No hormones or additives', 'Fresh-cut to order', 'Goat, sheep & rabbit available'],
  },
  'egg': {
    short: 'Kienyeji pasture raised eggs from free-range hens. Fresh, nutritious, and delivered daily in Nairobi.',
    long: 'Our kienyeji eggs come from hens that roam freely on open pasture — richer yolks, better nutrition, and genuine free-range taste. Order fresh daily with express delivery across Nairobi.',
    features: ['100% free-range pasture raised', 'Richer, more nutritious yolks', 'Harvested & delivered daily', 'No cages, no crowding'],
  },
  'dairy-products': {
    short: 'Fresh dairy products including cow, goat, and camel milk, yogurt, cheese, and butter — delivered in Nairobi.',
    long: 'From fresh cow milk and mursik to goat and camel milk, our dairy range covers everyday staples and traditional Kenyan products. All sourced from trusted local farms.',
    features: ['Cow, goat & camel milk', 'Yogurt, mursik & fermented milk', 'Artisan cheese & fresh butter', 'Farm-direct sourcing'],
  },
  'baby-products': {
    short: 'Baby essentials in Nairobi — diapers, formula, baby food, wipes, and care products delivered fast.',
    long: 'Everything your newborn and growing baby needs — from diapers and formula to baby food, wipes, lotion, and feeding accessories. Trusted brands at everyday prices.',
    features: ['Diapers & wipes', 'Baby formula & food', 'Care & hygiene products', 'Feeding accessories'],
  },
  'cleaning-materials-equipment': {
    short: 'Professional cleaning supplies, detergents, disinfectants, and equipment delivered in Nairobi.',
    long: 'Stock up on commercial and household cleaning supplies — detergents, disinfectants, floor cleaners, mops, brooms, and more. Ideal for homes, offices, and businesses.',
    features: ['Household & commercial grade', 'Detergents & disinfectants', 'Cleaning tools & equipment', 'Bulk orders available'],
  },
  'handicrafts-1': {
    short: 'Handmade Kenyan handicrafts — traditional wooden utensils, serving ware, and artisan products.',
    long: 'Discover authentic Kenyan craftsmanship — hand-carved wooden utensils, serving bowls, cooking tools, and traditional decorative items made by local artisans.',
    features: ['Hand-carved by local artisans', 'Sustainable & eco-friendly', 'Wooden utensils & serving ware', 'Traditional Kenyan designs'],
  },
  'stationery': {
    short: 'Office and school stationery delivered in Nairobi — pens, notebooks, printing paper, art supplies, and more.',
    long: 'Everything for the office or classroom — pens, exercise books, printing paper, envelopes, folders, art materials, and craft supplies. Fast delivery across Nairobi.',
    features: ['Office & school essentials', 'Art & craft materials', 'Bulk orders for businesses', 'Same-day delivery available'],
  },
  'samosas': {
    short: 'Fresh handmade samosas delivered in Nairobi — beef, chicken, and vegetable varieties made daily.',
    long: 'Our samosas are made fresh daily by skilled pastry cooks — crispy, golden, and packed with flavour. Available in beef, chicken, and vegetable varieties. Perfect for events or everyday snacking.',
    features: ['Made fresh daily', 'Beef, chicken & vegetable', 'Crispy golden pastry', 'Bulk event orders welcome'],
  },
  'beverages-1': {
    short: 'Beverages delivered in Nairobi — fresh juices, soft drinks, water, and healthy drinks.',
    long: 'Refresh with our beverage range — from freshly squeezed juices and soft drinks to drinking water and traditional Kenyan beverages. Great prices, fast delivery.',
    features: ['Fresh juices & smoothies', 'Soft drinks & water', 'Traditional beverages', 'Healthy drink options'],
  },
  'herbs-spices': {
    short: 'Fresh herbs, spices, masala, and seasonings — all your cooking essentials delivered in Nairobi.',
    long: 'Elevate your cooking with our full range of fresh herbs and spices — coriander, mint, rosemary, thyme, garam masala, turmeric, and custom spice blends sourced for freshness.',
    features: ['Fresh herbs & dried spices', 'Masala & spice blends', 'Traditional Kenyan seasonings', 'Sourced for freshness'],
  },
};

const DEFAULT_DESCRIPTION = {
  short: `Shop ${SITE_NAME} for fresh, quality products delivered fast in Nairobi.`,
  long: `Browse our full selection and enjoy express delivery across Nairobi. Free delivery on orders over KES 2000.`,
  features: ['Farm-direct sourcing', 'Express delivery in Nairobi', 'M-Pesa & cash on delivery', 'Free delivery over KES 2000'],
};

function getCategoryContent(slug: string) {
  return CATEGORY_DESCRIPTIONS[slug] || DEFAULT_DESCRIPTION;
}

// ─── generateStaticParams ────────────────────────────────────────────────────

export async function generateStaticParams() {
  const categories = await fetchAllCategories();
  return categories.map((cat: any) => ({ slug: cat.slug || cat.id.toString() }));
}

// ─── generateMetadata ────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    return {
      title: 'Category Not Found | Lando Hypermarket',
      robots: { index: false, follow: false },
    };
  }

  const content = getCategoryContent(params.slug);
  const canonicalUrl = `${SITE_URL}/categories/${category.slug || category.id}`;
  const title = `${category.name} | Online Delivery Nairobi | ${SITE_NAME}`;

  return {
    title,
    description: content.short,
    keywords: [
      `${category.name} Nairobi`,
      `${category.name} delivery`,
      `buy ${category.name} online Kenya`,
      `fresh ${category.name}`,
      `${category.name} near me`,
      `online ${category.name} Kenya`,
      `${SITE_NAME} ${category.name}`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_KE',
      title,
      description: content.short,
      images: [
        {
          url: category.image_url || `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${category.name} - ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: content.short,
      images: [category.image_url || `${SITE_URL}/twitter-image.jpg`],
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
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) notFound();

  const content = getCategoryContent(params.slug);
  const canonicalUrl = `${SITE_URL}/categories/${category.slug || category.id}`;

  // Inline JSON-LD: CollectionPage + BreadcrumbList
  const jsonLdCollectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#collection`,
    name: category.name,
    description: content.short,
    url: canonicalUrl,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    ...(category.image_url && {
      image: {
        '@type': 'ImageObject',
        url: category.image_url,
        name: category.name,
      },
    }),
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories` },
      { '@type': 'ListItem', position: 3, name: category.name, item: canonicalUrl },
    ],
  };

  return (
    <>
      {/* Inline schema — visible to Googlebot in raw HTML */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollectionPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      {/*
        Visually hidden but indexable H1.
        The client component renders its own visible heading — this H1 is
        for crawlers only (sr-only keeps it out of the visual layout).
        Remove sr-only if you want it visible.
      */}
      <h1 className="sr-only">{category.name} — Online Delivery Nairobi | {SITE_NAME}</h1>

      {/* All existing UI — unchanged */}
      <CategoryPageClient slug={params.slug} />

      {/* SEO content block — below the product grid, above the footer */}
      <section className="border-t border-gray-100 bg-gray-50 py-10 mt-4">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 max-w-4xl">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            {category.name} — Delivered Fresh in Nairobi
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-5">{content.long}</p>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {content.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-xs text-gray-700 bg-white rounded-lg px-3 py-2.5 border border-gray-100 shadow-sm"
              >
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-6">
            <a href={SITE_URL} className="hover:text-emerald-600 transition-colors">{SITE_NAME}</a>
            {' · '}
            <a href={`${SITE_URL}/categories`} className="hover:text-emerald-600 transition-colors">All Categories</a>
            {' · '}
            <a href={`${SITE_URL}/products`} className="hover:text-emerald-600 transition-colors">All Products</a>
            {' · '}
            Free delivery on orders over KES 2,000 across Nairobi
          </p>
        </div>
      </section>
    </>
  );
}