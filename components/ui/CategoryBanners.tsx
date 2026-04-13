'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowRight, ShoppingBag } from 'lucide-react';

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  order: number;
  is_active: boolean;
  products_count?: number;
}

// Distinct gradient palettes for each banner card
const GRADIENTS = [
  { from: '#004E9A', to: '#0070D8', accent: '#FFD700', light: '#E8F4FF' },
  { from: '#1B6B3A', to: '#2E9E57', accent: '#F9E04B', light: '#E8F9EE' },
  { from: '#7B2D8B', to: '#A855C8', accent: '#FFB347', light: '#F5E8FF' },
  { from: '#C0392B', to: '#E74C3C', accent: '#FFEAA7', light: '#FFF0EE' },
  { from: '#D35400', to: '#F39C12', accent: '#FFFFFF', light: '#FFF5E8' },
  { from: '#1A5276', to: '#2980B9', accent: '#A8E6CF', light: '#E8F4FF' },
];

// Decorative SVG shapes for each card
const SHAPES = [
  // Circles top-right
  <svg key="a" className="absolute -top-6 -right-6 w-32 h-32 opacity-10" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="white"/></svg>,
  // Diamond
  <svg key="b" className="absolute -bottom-4 -right-4 w-28 h-28 opacity-10" viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" transform="rotate(45 50 50)" fill="white"/></svg>,
  // Triangle
  <svg key="c" className="absolute -top-4 -right-4 w-32 h-32 opacity-10" viewBox="0 0 100 100"><polygon points="50,0 100,100 0,100" fill="white"/></svg>,
  // Hexagon
  <svg key="d" className="absolute -bottom-6 right-2 w-28 h-28 opacity-10" viewBox="0 0 100 100"><polygon points="50,0 93,25 93,75 50,100 7,75 7,25" fill="white"/></svg>,
  // Star
  <svg key="e" className="absolute -top-4 -right-4 w-32 h-32 opacity-10" viewBox="0 0 100 100"><polygon points="50,0 61,35 97,35 68,57 79,91 50,70 21,91 32,57 3,35 39,35" fill="white"/></svg>,
  // Blob / pill
  <svg key="f" className="absolute -bottom-4 -right-4 w-32 h-20 opacity-10" viewBox="0 0 160 80"><ellipse cx="80" cy="40" rx="80" ry="40" fill="white"/></svg>,
];

interface CategoryBannersProps {
  /** How many categories to display (default 6) */
  limit?: number;
  /** Section heading (pass empty string to hide) */
  heading?: string;
}

const CategoryBanners: React.FC<CategoryBannersProps> = ({
  limit = 6,
  heading = 'Shop By Category',
}) => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    let clean = path.startsWith('/') ? path.slice(1) : path;
    if (clean.startsWith('storage/')) clean = clean.replace('storage/', '');
    return `https://api.hypermarket.co.ke/storage/${clean}`;
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const res = await api.categories.getAll();
        const all: CategoryData[] = res.data || [];
        setCategories(
          all.filter((c) => c.is_active).slice(0, limit)
        );
      } catch (e) {
        console.error('CategoryBanners fetch error:', e);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [limit]);

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <section className="category-banners-section">
        {heading && (
          <div className="cb-header">
            <h2 className="cb-heading">{heading}</h2>
          </div>
        )}
        <div className="cb-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="cb-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  /* ── Rendered banners ── */
  return (
    <section className="category-banners-section">
      {heading && (
        <div className="cb-header">
          <h2 className="cb-heading">{heading}</h2>
          <Link href="/categories" className="cb-view-all">
            View all <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="cb-grid">
        {categories.map((cat, idx) => {
          const grad = GRADIENTS[idx % GRADIENTS.length];
          const shape = SHAPES[idx % SHAPES.length];
          const imgSrc = getImageUrl(cat.image);

          return (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="cb-card"
              style={{
                background: `linear-gradient(135deg, ${grad.from} 0%, ${grad.to} 100%)`,
              }}
            >
              {/* Decorative shape */}
              <div className="cb-shape">{shape}</div>

              {/* Small circle dot pattern */}
              <div className="cb-dots" />

              {/* Content */}
              <div className="cb-content">
                {/* Icon / image */}
                <div
                  className="cb-icon-wrap"
                  style={{ backgroundColor: `${grad.accent}22`, borderColor: `${grad.accent}55` }}
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={cat.name}
                      className="cb-img"
                      loading="lazy"
                    />
                  ) : (
                    <ShoppingBag size={28} color={grad.accent} />
                  )}
                </div>

                <div className="cb-text">
                  <p className="cb-name">{cat.name}</p>
                  {cat.products_count ? (
                    <p className="cb-count">{cat.products_count} products</p>
                  ) : cat.description ? (
                    <p className="cb-count cb-desc">{cat.description}</p>
                  ) : null}
                </div>
              </div>

              {/* CTA pill */}
              <div
                className="cb-cta"
                style={{ backgroundColor: `${grad.accent}22`, borderColor: `${grad.accent}55`, color: grad.accent }}
              >
                Shop now <ArrowRight size={12} />
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx global>{`
        /* ─── Section ─── */
        .category-banners-section {
          padding: 28px 0 16px;
          background: #f8f9fc;
        }

        /* ─── Header ─── */
        .cb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px 16px;
          max-width: 1400px;
          margin: 0 auto;
        }
        @media (min-width: 640px) { .cb-header { padding: 0 24px 16px; } }
        @media (min-width: 1024px) { .cb-header { padding: 0 48px 20px; } }

        .cb-heading {
          font-size: 1.2rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.02em;
        }
        @media (min-width: 768px) { .cb-heading { font-size: 1.5rem; } }

        .cb-view-all {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #004E9A;
          text-decoration: none;
          transition: gap 0.2s;
        }
        .cb-view-all:hover { gap: 8px; }

        /* ─── Grid ─── */
        .cb-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          padding: 0 16px;
          max-width: 1400px;
          margin: 0 auto;
        }
        @media (min-width: 640px) {
          .cb-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 0 24px; }
        }
        @media (min-width: 1024px) {
          .cb-grid { grid-template-columns: repeat(6, 1fr); gap: 14px; padding: 0 48px; }
        }

        /* ─── Card ─── */
        .cb-card {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          padding: 18px 14px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 150px;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.22s ease;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
        }
        @media (min-width: 1024px) { .cb-card { min-height: 170px; padding: 20px 16px 16px; } }
        .cb-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 28px rgba(0,0,0,0.22);
        }
        .cb-card:active { transform: scale(0.97); }

        /* ─── Decorative ─── */
        .cb-shape { position: absolute; inset: 0; pointer-events: none; }
        .cb-dots {
          position: absolute;
          bottom: -10px;
          left: -10px;
          width: 80px;
          height: 80px;
          background-image: radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px);
          background-size: 10px 10px;
          pointer-events: none;
        }

        /* ─── Content ─── */
        .cb-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cb-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          border: 1.5px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          backdrop-filter: blur(4px);
          overflow: hidden;
        }
        @media (min-width: 1024px) { .cb-icon-wrap { width: 52px; height: 52px; } }

        .cb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cb-text { flex: 1; min-width: 0; }

        .cb-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.25;
          letter-spacing: -0.01em;
          text-shadow: 0 1px 3px rgba(0,0,0,0.25);
          margin: 0;
          /* clamp to 2 lines */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (min-width: 768px) { .cb-name { font-size: 0.88rem; } }

        .cb-count {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.75);
          margin: 3px 0 0;
          font-weight: 500;
        }
        .cb-desc {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ─── CTA pill ─── */
        .cb-cta {
          position: relative;
          z-index: 1;
          align-self: flex-start;
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid;
          backdrop-filter: blur(4px);
          transition: gap 0.18s, opacity 0.18s;
        }
        .cb-card:hover .cb-cta { gap: 7px; opacity: 1; }

        /* ─── Skeleton ─── */
        .cb-skeleton {
          min-height: 150px;
          border-radius: 16px;
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: cb-shimmer 1.4s infinite;
        }
        @keyframes cb-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
};

export default CategoryBanners;