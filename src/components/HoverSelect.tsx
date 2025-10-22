'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Option = {
  label: string
  value: string
  color?: string
  href?: string
  onSelect?: () => void
}

export default function HoverSelect({
  label,
  options,
  align = 'left',
  theme = 'dark',
}: {
  label: string
  options: Option[]
  align?: 'left' | 'right'
  theme?: 'dark' | 'light'
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const WRAP_CLOSE_DELAY = 140 // ms, podés subirlo si querés más “tolerancia”

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimer.current = window.setTimeout(() => setOpen(false), WRAP_CLOSE_DELAY)
  }

  useEffect(() => () => clearCloseTimer(), [])

  const baseBtn =
    theme === 'dark'
      ? 'px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800'
      : 'px-3 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-100'

  const menuCls =
    theme === 'dark'
      ? 'absolute mt-2 min-w-[220px] rounded-xl border border-gray-800 bg-neutral-900/95 shadow-lg backdrop-blur p-1'
      : 'absolute mt-2 min-w-[220px] rounded-xl border border-gray-200 bg-white shadow-lg p-1'

  const itemCls =
    theme === 'dark'
      ? 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-gray-800'
      : 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-800 hover:bg-gray-100'

  const dot = (c?: string) => (
    <span
      aria-hidden
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: c || '#9CA3AF' }}
    />
  )

  const handlePick = (opt: Option) => {
    if (opt.onSelect) opt.onSelect()
    if (opt.href) router.push(opt.href)
    setOpen(false)
  }

  return (
    <div
      className="relative"
      onPointerEnter={() => {
        clearCloseTimer()
        setOpen(true)
      }}
      onPointerLeave={() => {
        scheduleClose()
      }}
    >
      {/* Trigger */}
      <button
        type="button"
        className={baseBtn}
        aria-haspopup="menu"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => scheduleClose()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
          if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v)
        }}
      >
        {label}
      </button>

      {/* Menu */}
      {open && (
        <div
          role="menu"
          className={menuCls}
          style={{ [align === 'right' ? 'right' : 'left']: 0 } as any}
        >
          {options.map((opt, i) => (
            <button
              key={`${opt.value}-${i}`} // <- clave única
              role="menuitem"
              className={itemCls}
              // Disparamos en mousedown para “ganarle” al blur del hover
              onMouseDown={(e) => {
                e.preventDefault()
                handlePick(opt)
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                handlePick(opt)
              }}
            >
              {dot(opt.color)}
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
