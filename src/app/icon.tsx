import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const filePath = path.join(process.cwd(), 'public', 'images', 'onlinesalelive-logo.png');
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const src = `data:image/png;base64,${base64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="OnlineSaleLive"
          width={32}
          height={32}
          style={{ objectFit: 'contain', width: '100%', height: '100%' }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
