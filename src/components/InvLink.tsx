// components/InvLink.tsx
'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'

export default function InvLink({
  href,
  children,
  className,
}: { href: string; children: ReactNode; className?: string }) {
  const sp = useSearchParams()
  const inv = sp.get('inv') || 'general'
  const url = href.includes('?')
    ? `${href}&inv=${encodeURIComponent(inv)}`
    : `${href}?inv=${encodeURIComponent(inv)}`
  return <Link href={url} className={className}>{children}</Link>
}
