import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const alt = 'OnlineSaleLive | Best Deals, Sales & Discounts in India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const filePath = path.join(process.cwd(), 'public', 'images', 'onlinesalelive-logo.png');
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const logoSrc = `data:image/png;base64,${base64}`;

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
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: 6,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="OnlineSaleLive"
              width={60}
              height={60}
              style={{ objectFit: 'contain' }}
            />
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
