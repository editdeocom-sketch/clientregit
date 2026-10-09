import type { Api, Currency, InvoiceStatus, ProjectStatus } from '@shared/types'

export * from '@shared/types'

declare global {
  interface Window {
    api: Api
  }
}

export const api: Api = window.api

export function money(amount: number, currency: Currency): string {
  const value = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value)
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isOverdue(iso: string | null | undefined): boolean {
  return !!iso && iso.slice(0, 10) < todayIso()
}

export type Tone = 'neutral' | 'gold' | 'info' | 'warn' | 'success' | 'danger' | 'teal' | 'muted'

export const projectTone: Record<ProjectStatus, Tone> = {
  enquiry: 'info',
  in_progress: 'gold',
  review: 'teal',
  revision: 'danger',
  delivered: 'success',
  cancelled: 'muted'
}

export const BLINK_STATUSES: ProjectStatus[] = [
  'enquiry',
  'in_progress',
  'review',
  'revision'
]

export function statusBlinks(status: ProjectStatus): boolean {
  return BLINK_STATUSES.includes(status)
}

export const invoiceTone: Record<InvoiceStatus, Tone> = {
  draft: 'neutral',
  sent: 'info',
  partial: 'warn',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'muted'
}

export const CHART_COLORS = ['#dfc57b', '#bf932a', '#9e6200', '#8a7a52', '#ecdcab']
