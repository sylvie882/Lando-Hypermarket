'use client';

import React from 'react';
import Link from 'next/link';

interface OfferItem {
  id: number;
  name: string;
  price: string;
  badge: string;
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  SALE:     { bg: '#E74C3C', text: '#fff' },
  FEATURED: { bg: '#27AE60', text: '#fff' },
  NEW:      { bg: '#2980B9', text: '#fff' },
  FRESH:    { bg: '#16A085', text: '#fff' },
  ORGANIC:  { bg: '#8E44AD', text: '#fff' },
  IMPORTED: { bg: '#E67E22', text: '#fff' },
  PREMIUM:  { bg: '#2C3E50', text: '#fff' },
};

const getBadgeStyle = (badge: string) => {
  return BADGE_COLORS[badge] ?? { bg: '#27AE60', text: '#fff' };
};

const OffersTickerStrip: React.FC<{ offers: OfferItem[] }> = ({ offers }) => {
  if (!offers || offers.length === 0) return null;

  const doubled = [...offers, ...offers];

  return (
    <div
      style={{
        background: '#f9f9f0',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        height: '40px',
        marginBottom: '10px',
        fontFamily: 'inherit',
        userSelect: 'none',
      }}
    >
      {/* Label */}
      <div
        style={{
          background: '#E3000B',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 600,
          padding: '0 14px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          gap: '6px',
          flexShrink: 0,
          letterSpacing: '0.4px',
        }}
      >
        <span style={{ fontSize: '14px' }}>🔥</span>
        TODAY&apos;S DEALS
      </div>

      {/* Scrolling track */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            animation: 'tickerScroll 30s linear infinite',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLDivElement).style.animationPlayState = 'paused')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLDivElement).style.animationPlayState = 'running')
          }
        >
          {doubled.map((item, i) => {
            const badgeStyle = getBadgeStyle(item.badge);
            return (
              <Link
                key={i}
                href={`/products/${item.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '0 20px',
                  color: '#004E9A',
                  fontSize: '12.5px',
                  height: '40px',
                  borderRight: '1px solid rgba(255,255,255,0.22)',
                  textDecoration: 'none',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.12)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')
                }
              >
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    padding: '1px 7px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {item.price}
                </span>
                <span
                  style={{
                    background: badgeStyle.bg,
                    color: badgeStyle.text,
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '3px',
                    padding: '1px 5px',
                    letterSpacing: '0.2px',
                  }}
                >
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default OffersTickerStrip;