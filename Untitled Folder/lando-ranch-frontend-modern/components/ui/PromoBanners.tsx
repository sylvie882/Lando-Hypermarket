'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  mobile_image: string | null;
  button_text: string | null;
  button_link: string | null;
  order: number;
  is_active: boolean;
  type: 'homepage' | 'category' | 'promotional' | 'sidebar';
  category_slug: string | null;
  image_url: string;
  mobile_image_url: string | null;
}

interface PromoBannersProps {
  /** Max banners to show (default: 5) */
  limit?: number;
}

const PromoBanners: React.FC<PromoBannersProps> = ({ limit = 5 }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getLink = (banner: Banner): string => {
    if (banner.button_link) return banner.button_link;
    if (banner.category_slug) return `/categories/${banner.category_slug}`;
    return '/products';
  };

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.banners.getAll({ type: 'promotional', limit });
      let data: Banner[] = [];
      if (res.data?.data) data = res.data.data;
      else if (Array.isArray(res.data)) data = res.data;

      const promo = data
        .filter((b) => b.is_active)
        .sort((a, b) => a.order - b.order)
        .slice(0, limit);

      setBanners(promo);
      promo.forEach((b) => api.banners.trackImpression(b.id).catch(() => {}));
    } catch (e) {
      console.error('PromoBanners fetch error:', e);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleClick = (id: number) => {
    api.banners.trackClick(id).catch(() => {});
  };

  if (isLoading) {
    return (
      <section className="pb-section">
        <div className="pb-grid">
          <div className="pb-tile pb-tile--lg animate-shimmer" />
          <div className="pb-tile animate-shimmer" />
          <div className="pb-tile animate-shimmer" />
        </div>
        <style jsx global>{`
          .pb-section { padding: 20px 16px 8px; max-width: 1400px; margin: 0 auto; width: 100%; }
          @media (min-width: 640px)  { .pb-section { padding: 24px 24px 8px; } }
          @media (min-width: 1024px) { .pb-section { padding: 32px 48px 8px; } }
          .pb-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
          @media (min-width: 768px) { .pb-grid { grid-template-columns: 1.4fr 1fr; grid-template-rows: 1fr 1fr; } }
          .pb-tile { border-radius: 18px; min-height: 160px; background: #eee; }
          .pb-tile--lg { grid-row: span 2; min-height: 340px; }
        `}</style>
      </section>
    );
  }

  if (banners.length === 0) return null;

  // First banner gets the big hero tile; the rest stack alongside it.
  const [hero, ...rest] = banners;
  const sideTiles = rest.slice(0, 4);

  return (
    <section className="pb-section">
      <div className="flex items-center gap-2.5 mb-4 md:mb-5">
        <span className="section-accent-bar" style={{ background: 'var(--color-accent)' }} />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Today's Deals</h2>
      </div>

      <div className="pb-grid">
        <PromoTile banner={hero} large onTrackClick={handleClick} link={getLink(hero)} />
        {sideTiles.map((b) => (
          <PromoTile key={b.id} banner={b} onTrackClick={handleClick} link={getLink(b)} />
        ))}
      </div>

      <style jsx global>{`
        .pb-section {
          padding: 20px 16px 8px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        @media (min-width: 640px)  { .pb-section { padding: 24px 24px 8px; } }
        @media (min-width: 1024px) { .pb-section { padding: 32px 48px 8px; } }

        .pb-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 768px) {
          .pb-grid {
            grid-template-columns: 1.4fr 1fr 1fr;
            grid-auto-rows: 170px;
          }
        }

        .pb-tile-link {
          position: relative;
          display: block;
          border-radius: 18px;
          overflow: hidden;
          text-decoration: none;
          background: #14151a;
          box-shadow: var(--shadow-card);
          min-height: 170px;
          grid-column: span 1;
        }
        .pb-tile-link--lg {
          min-height: 260px;
          grid-column: span 1;
        }
        @media (min-width: 768px) {
          .pb-tile-link--lg { grid-row: span 2; grid-column: span 1; }
        }

        .pb-tile-img {
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pb-tile-link:hover .pb-tile-img { transform: scale(1.06); }

        .pb-tile-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%);
        }

        .pb-tile-text {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          padding: 14px 16px;
          color: #fff;
        }
      `}</style>
    </section>
  );
};

const PromoTile: React.FC<{
  banner: Banner;
  large?: boolean;
  link: string;
  onTrackClick: (id: number) => void;
}> = ({ banner, large, link, onTrackClick }) => {
  const imageUrl = banner.image_url || '';
  return (
    <Link
      href={link}
      onClick={() => onTrackClick(banner.id)}
      className={`pb-tile-link ${large ? 'pb-tile-link--lg' : ''}`}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={banner.title}
          fill
          className="pb-tile-img"
          sizes={large ? '(min-width: 768px) 45vw, 100vw' : '(min-width: 768px) 25vw, 100vw'}
          priority={large}
          unoptimized={imageUrl.startsWith('http')}
        />
      )}
      <div className="pb-tile-overlay" />
      <div className="pb-tile-text">
        {banner.subtitle && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-[#E3000B] px-2 py-0.5 rounded mb-1.5">
            {banner.subtitle}
          </span>
        )}
        <h3 className={`font-bold leading-tight ${large ? 'text-xl md:text-2xl' : 'text-sm md:text-base'}`}>
          {banner.title}
        </h3>
      </div>
    </Link>
  );
};

export default PromoBanners;
