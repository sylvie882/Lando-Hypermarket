'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
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
  start_date: string | null;
  end_date: string | null;
  type: 'homepage' | 'category' | 'promotional' | 'sidebar';
  category_slug: string | null;
  clicks: number;
  impressions: number;
  image_url: string;
  mobile_image_url: string | null;
}

interface PromoBannersProps {
  /** Max banners to show (default: 3 — gives a nice 1-big + 2-stacked or 3-equal layout) */
  limit?: number;
  /** Section heading — leave empty to hide */
  heading?: string;
}

const PromoBanners: React.FC<PromoBannersProps> = ({
  limit = 3,
  heading = 'Special Offers',
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getLink = (banner: Banner): string => {
    if (banner.button_link) return banner.button_link;
    if (banner.category_slug) return `/categories/${banner.category_slug}`;
    return '/products';
  }; 

  const getImageUrl = (banner: Banner, isMobile = false): string => {
    if (isMobile && banner.mobile_image_url) return banner.mobile_image_url;
    return banner.image_url || '';
  };

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      // Pass type=promotional directly — the backend defaults to 'homepage' if omitted
      const res = await api.banners.getAll({ type: 'promotional', limit });
      let data: Banner[] = [];
      if (res.data?.data) data = res.data.data;
      else if (Array.isArray(res.data)) data = res.data;

      const promo = data
        .filter((b) => b.is_active)
        .sort((a, b) => a.order - b.order)
        .slice(0, limit);

      setBanners(promo);

      // Track impressions
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

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <section className="pb-section">
        {/* {heading && (
          <div className="pb-header">
            <span className="pb-heading-skeleton" />
          </div>
        )} */}
        <div className="pb-grid pb-grid--skeleton">
          <div className="pb-skeleton pb-skeleton--large" />
          <div className="pb-stack">
            <div className="pb-skeleton" />
            <div className="pb-skeleton" />
          </div>
        </div>
      </section>
    );
  }

  if (banners.length === 0) return null;

  /* ── Determine layout ── */
  // 1 banner  → full width
  // 2 banners → 50/50
  // 3+        → large left + 2 stacked right
  const layout: '1' | '2' | '3' =
    banners.length === 1 ? '1' : banners.length === 2 ? '2' : '3';

  return (
    <section className="pb-section">
     
      <div className={`pb-grid pb-grid--${layout}`}>
        {layout === '1' && (
          <BannerCard
            banner={banners[0]}
            imageUrl={getImageUrl(banners[0])}
            link={getLink(banners[0])}
            onClick={handleClick}
            size="large"
          />
        )}

        {layout === '2' && (
          <>
            <BannerCard
              banner={banners[0]}
              imageUrl={getImageUrl(banners[0])}
              link={getLink(banners[0])}
              onClick={handleClick}
              size="medium"
            />
            <BannerCard
              banner={banners[1]}
              imageUrl={getImageUrl(banners[1])}
              link={getLink(banners[1])}
              onClick={handleClick}
              size="medium"
            />
          </>
        )}

        {layout === '3' && (
          <>
            {/* Left — large featured banner */}
            <BannerCard
              banner={banners[0]}
              imageUrl={getImageUrl(banners[0])}
              link={getLink(banners[0])}
              onClick={handleClick}
              size="large"
            />
            {/* Right — two stacked */}
            <div className="pb-stack">
              <BannerCard
                banner={banners[1]}
                imageUrl={getImageUrl(banners[1])}
                link={getLink(banners[1])}
                onClick={handleClick}
                size="small"
              />
              <BannerCard
                banner={banners[2]}
                imageUrl={getImageUrl(banners[2])}
                link={getLink(banners[2])}
                onClick={handleClick}
                size="small"
              />
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        /* ─── Section ─── */
        .pb-section {
          padding: 24px 16px 8px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        @media (min-width: 640px)  { .pb-section { padding: 28px 24px 10px; } }
        @media (min-width: 1024px) { .pb-section { padding: 32px 48px 12px; } }

        /* ─── Header ─── */
        .pb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .pb-heading {
          font-size: 1.2rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.02em;
          margin: 0;
        }
        @media (min-width: 768px) { .pb-heading { font-size: 1.45rem; } }
        .pb-heading-skeleton {
          display: block;
          width: 160px;
          height: 24px;
          border-radius: 6px;
          background: #e5e7eb;
        }
        .pb-see-all {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #004E9A;
          text-decoration: none;
          transition: gap 0.18s;
        }
        .pb-see-all:hover { gap: 8px; }

        /* ─── Grid layouts ─── */
        .pb-grid {
          display: grid;
          gap: 12px;
        }
        /* 1 banner — single full row */
        .pb-grid--1 {
          grid-template-columns: 1fr;
        }
        /* 2 banners — equal halves */
        .pb-grid--2 {
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .pb-grid--2 { grid-template-columns: 1fr 1fr; }
        }
        /* 3 banners — 60/40 split */
        .pb-grid--3 {
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .pb-grid--3 { grid-template-columns: 3fr 2fr; }
        }
        /* Skeleton grid */
        .pb-grid--skeleton {
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .pb-grid--skeleton { grid-template-columns: 3fr 2fr; }
        }

        /* ─── Stacked right column ─── */
        .pb-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 240px;
        }
        .pb-stack > * { flex: 1; }

        /* ─── Skeleton ─── */
        .pb-skeleton {
          border-radius: 16px;
          min-height: 180px;
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: pb-shimmer 1.4s infinite;
        }
        .pb-skeleton--large { min-height: 320px; }
        @keyframes pb-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ─── Banner card ─── */
        .pb-card {
          position: relative;
          display: block;
          overflow: hidden;
          border-radius: 16px;
          text-decoration: none;
          cursor: pointer;
          background: #1a1a2e;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.25s ease;
          box-shadow: 0 2px 14px rgba(0,0,0,0.13);
        }
        .pb-card:hover {
          transform: translateY(-3px) scale(1.015);
          box-shadow: 0 14px 32px rgba(0,0,0,0.2);
        }
        .pb-card:active { transform: scale(0.98); }

        /* Heights by size */
        .pb-card--large { min-height: 320px; }
        .pb-card--medium { min-height: 220px; }
        .pb-card--small { min-height: 0; height: 100%; min-height: 140px; }

        @media (min-width: 768px) {
          .pb-card--large  { min-height: 380px; }
          .pb-card--medium { min-height: 280px; }
          .pb-card--small  { min-height: 0; }
        }

        /* ─── Image ─── */
        .pb-img {
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .pb-card:hover .pb-img { transform: scale(1.05); }

        /* ─── Overlays ─── */
        .pb-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,0,0,0.72) 0%,
            rgba(0,0,0,0.28) 45%,
            rgba(0,0,0,0.05) 100%
          );
          z-index: 1;
        }
        /* Large banners get a left-side gradient too */
        .pb-card--large .pb-overlay {
          background: linear-gradient(
            135deg,
            rgba(0,0,0,0.65) 0%,
            rgba(0,0,0,0.3) 50%,
            rgba(0,0,0,0.05) 100%
          );
        }

        /* ─── Content ─── */
        .pb-content {
          position: absolute;
          z-index: 2;
          padding: 16px 18px;
          bottom: 0;
          left: 0;
          right: 0;
        }
        .pb-card--large .pb-content {
          bottom: auto;
          top: 50%;
          transform: translateY(-50%);
          max-width: 70%;
        }
        @media (min-width: 768px) {
          .pb-content { padding: 20px 24px; }
          .pb-card--large .pb-content { max-width: 60%; left: 32px; }
        }

        /* Badge */
        .pb-badge {
          display: inline-block;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #fff;
          background: #E67E22;
          padding: 3px 8px;
          border-radius: 4px;
          margin-bottom: 7px;
        }

        /* Title */
        .pb-title {
          font-size: 1rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.25;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 6px rgba(0,0,0,0.4);
          margin: 0 0 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pb-card--large .pb-title {
          font-size: 1.35rem;
          -webkit-line-clamp: 3;
          margin-bottom: 8px;
        }
        @media (min-width: 768px) {
          .pb-title { font-size: 1.05rem; }
          .pb-card--large .pb-title { font-size: 1.65rem; }
        }

        /* Subtitle */
        .pb-subtitle {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.82);
          margin: 0 0 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (min-width: 768px) { .pb-subtitle { font-size: 0.82rem; } }

        /* CTA button */
        .pb-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #fff;
          background: #004E9A;
          border: none;
          padding: 7px 14px;
          border-radius: 8px;
          letter-spacing: 0.01em;
          transition: background 0.18s, gap 0.18s, transform 0.18s;
          cursor: pointer;
          text-decoration: none;
        }
        .pb-btn:hover { background: #003E8A; gap: 8px; transform: translateX(2px); }
        .pb-card--large .pb-btn { font-size: 0.8rem; padding: 9px 18px; border-radius: 10px; }
      `}</style>
    </section>
  );
};

/* ── Individual banner card ── */
interface BannerCardProps {
  banner: Banner;
  imageUrl: string;
  link: string;
  onClick: (id: number) => void;
  size: 'large' | 'medium' | 'small';
}

const BannerCard: React.FC<BannerCardProps> = ({ banner, imageUrl, link, onClick, size }) => (
  <Link
    href={link}
    onClick={() => onClick(banner.id)}
    className={`pb-card pb-card--${size}`}
  >
    {/* Image */}
    {imageUrl && (
      <Image
        src={imageUrl}
        alt={banner.title}
        fill
        className="pb-img"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={size === 'large'}
      />
    )}

  </Link>
);

export default PromoBanners;