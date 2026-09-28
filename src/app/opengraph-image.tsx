import { ImageResponse } from 'next/og';

export const alt = 'OnlineSaleLive | Best Deals, Sales & Discounts in India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          fontFamily: 'sans-serif',
          color: 'white',
          padding: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
            }}
          >
            ⚡
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 56, fontWeight: 900, letterSpacing: -1 }}>
            OnlineSale<span style={{ color: '#ea580c' }}>Live</span>
            <span
              style={{
                marginLeft: 12,
                fontSize: 22,
                fontWeight: 800,
                background: '#ea580c',
                color: 'white',
                padding: '4px 10px',
                borderRadius: 8,
              }}
            >
              IN
            </span>
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#cbd5e1',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Discover Verified Deals, Mega Festive Sales & Price Comparisons
        </div>
        <div
          style={{
            fontSize: 20,
            color: '#f97316',
            marginTop: 24,
            fontWeight: 700,
          }}
        >
          Amazon • Flipkart • Myntra • AJIO • Meesho
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
