'use client'

import React, { useMemo } from 'react'

type Variant = 'full' | 'header' | 'section'

export default function CircuitBackground({
  variant = 'full',
  color = '#22d3ee',      // cyan-400
  accent = '#818cf8',     // indigo-400
  density = 14,           // líneas por eje
  speedSec = 7,           // velocidad del “barrido”
  className = '',
  radius = 'none',        // para “section”: 'none' | 'md' | 'xl' | '2xl'
}: {
  variant?: Variant
  color?: string
  accent?: string
  density?: number
  speedSec?: number
  className?: string
  radius?: 'none' | 'md' | 'xl' | '2xl'
}) {
  // Tamaños según variante
  const { w, h, wrapperCls } = useMemo(() => {
    if (variant === 'header') {
      return {
        w: 1440,
        h: 64,
        wrapperCls:
          'absolute inset-0 pointer-events-none -z-0 [mask-image:linear-gradient(to bottom,rgba(0,0,0,.7),transparent)]',
      }
    }
    if (variant === 'section') {
      return {
        w: 1200,
        h: 420,
        wrapperCls:
          `absolute inset-0 pointer-events-none -z-0 overflow-hidden ${radiusToCls(radius)} ` +
          '[mask-image:radial-gradient(120%_120% at 50% 0%,rgba(0,0,0,.9),transparent)]',
      }
    }
    // full
    return {
      w: 2000,
      h: 1200,
      wrapperCls:
        'fixed inset-0 pointer-events-none -z-0 ' +
        '[mask-image:radial-gradient(120%_80% at 50% 10%,rgba(0,0,0,.9),transparent)]',
    }
  }, [variant, radius])

  // Generar grilla de líneas
  const { hLines, vLines, nodes } = useMemo(() => {
    const gapX = w / density
    const gapY = h / density

    const hLines = Array.from({ length: density }, (_, r) => ({
      d: `M 0 ${Math.round(r * gapY)} H ${w}`,
      delay: (r * 97) % speedSec,
    }))
    const vLines = Array.from({ length: density }, (_, c) => ({
      d: `M ${Math.round(c * gapX)} 0 V ${h}`,
      delay: (c * 113) % speedSec,
    }))

    // “Nodos” que titilan
    const nodes = Array.from({ length: Math.max(10, density) }, (_, i) => ({
      cx: Math.round(((i * 829) % w) * 0.9 + w * 0.05),
      cy: Math.round(((i * 613) % h) * 0.9 + h * 0.05),
      delay: (i * 0.37) % 2.5,
    }))

    return { hLines, vLines, nodes }
  }, [w, h, density, speedSec])

  return (
    <div className={wrapperCls + ' ' + className} aria-hidden>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          {/* Glow sutil */}
          <filter id="cg-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Gradiente para mezclar dos tonos */}
          <linearGradient id="cg-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"  stopColor={color}  stopOpacity="0.9" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Líneas horizontales */}
        {hLines.map((l, i) => (
          <g key={'h'+i} filter="url(#cg-glow)">
            {/* Trazo principal */}
            <path
              d={l.d}
              stroke="url(#cg-grad)"
              strokeWidth="1"
              strokeLinecap="round"
              className="cg-animate"
              style={{
                opacity: 0.5,
                strokeDasharray: '6 12',
                animation: `cg-dash ${speedSec}s linear infinite`,
                animationDelay: `${l.delay}s`,
              }}
            />
            {/* Resplandor más tenue */}
            <path
              d={l.d}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              style={{ opacity: 0.06 }}
            />
          </g>
        ))}

        {/* Líneas verticales */}
        {vLines.map((l, i) => (
          <g key={'v'+i} filter="url(#cg-glow)">
            <path
              d={l.d}
              stroke="url(#cg-grad)"
              strokeWidth="1"
              strokeLinecap="round"
              className="cg-animate"
              style={{
                opacity: 0.45,
                strokeDasharray: '6 12',
                animation: `cg-dash ${speedSec + 1.5}s linear infinite`,
                animationDelay: `${l.delay}s`,
              }}
            />
            <path
              d={l.d}
              stroke={accent}
              strokeWidth="3"
              strokeLinecap="round"
              style={{ opacity: 0.05 }}
            />
          </g>
        ))}

        {/* Nodos que titilan */}
        {nodes.map((n, i) => (
          <circle
            key={'n'+i}
            cx={n.cx}
            cy={n.cy}
            r="1.7"
            fill={accent}
            className="cg-animate"
            style={{
              animation: `cg-blink 2.6s ease-in-out infinite`,
              animationDelay: `${n.delay}s`,
              opacity: 0.25,
              filter: 'url(#cg-glow)',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

function radiusToCls(r: 'none'|'md'|'xl'|'2xl') {
  switch (r) {
    case 'md': return 'rounded-md'
    case 'xl': return 'rounded-xl'
    case '2xl': return 'rounded-2xl'
    default: return ''
  }
}
