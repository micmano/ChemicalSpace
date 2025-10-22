// src/components/ConfirmButton.tsx
'use client'

import React from 'react'

export default function ConfirmButton({
  children,
  confirm,
  className = '',
}: {
  children: React.ReactNode
  confirm: string
  className?: string
}) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirm)) {
          e.preventDefault()
        }
      }}
    >
      {children}
    </button>
  )
}
