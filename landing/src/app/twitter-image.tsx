import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Patriot Ops Center — Your Mission Continues'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background:
            'linear-gradient(135deg, #0a1628 0%, #0f2744 50%, #1e3a5f 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: '#fbbf24',
            textTransform: 'uppercase',
          }}
        >
          Patriot Ops Center
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            maxWidth: 1000,
          }}
        >
          Your Mission Continues.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            lineHeight: 1.35,
            color: '#cbd5e1',
            maxWidth: 980,
          }}
        >
          VA benefits guidance, claims support, and career transition tools — built for those who served.
        </div>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            color: '#94a3b8',
          }}
        >
          <span>Benefits Navigator · Claims Copilot · Always Free</span>
          <span style={{ color: '#fbbf24' }}>patriot-ops.com</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
