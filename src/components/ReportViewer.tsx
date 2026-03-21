/**
 * ReportViewer component
 *
 * A focused card modal that shows:
 *   1. A report preview card — title, date, file size badge, category tags
 *   2. An AI-generated executive summary (auto-fetched on open)
 *   3. A prominent "Open Full PDF" button that opens the PDF in a new tab
 *
 * Props:
 *   onClose — called when the user dismisses the modal
 */

import { useState, useEffect, useCallback } from 'react'

interface ReportMeta {
  title:    string
  date:     string
  filename: string
}

type SummaryStatus = 'loading' | 'success' | 'error'

interface ReportViewerProps {
  onClose: () => void
}

/** Static report info — shown immediately, before the API responds */
const REPORT_INFO: ReportMeta = {
  title:    'Best Productivity Tools 2026',
  date:     'March 21, 2026',
  filename: 'research-report-best-productivity-tools-2026.pdf',
}

/** PDF URL served as a static asset from /public/reports/ */
const PDF_URL = '/reports/research-report-best-productivity-tools-2026.pdf'

export default function ReportViewer({ onClose }: ReportViewerProps) {
  const [status,  setStatus]  = useState<SummaryStatus>('loading')
  const [summary, setSummary] = useState<string[]>([])
  const [error,   setError]   = useState<string | null>(null)

  // ── Close on Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // ── Lock body scroll while open ────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  /**
   * Fetch the Claude-generated summary from /api/summarize-report.
   * Runs automatically when the modal first mounts.
   */
  const loadSummary = useCallback(async () => {
    setStatus('loading')
    setError(null)
    setSummary([])

    try {
      const res  = await fetch('/api/summarize-report')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')

      // Split into individual bullet lines, filter blanks
      const lines = (data.summary as string)
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean)

      setSummary(lines)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary.')
      setStatus('error')
    }
  }, [])

  // Auto-load on mount
  useEffect(() => { loadSummary() }, [loadSummary])

  return (
    /* ── Backdrop — click outside to close ─────────────────────────────── */
    <div
      className="rv-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rv-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="rv-card">

        {/* ── Close button ──────────────────────────────────────────────── */}
        <button
          className="rv-close"
          onClick={onClose}
          aria-label="Close (Esc)"
          title="Close (Esc)"
        >
          <CloseIcon />
        </button>

        {/* ── Report identity block ──────────────────────────────────────── */}
        <div className="rv-identity">
          <div className="rv-file-icon" aria-hidden="true">
            <PdfIcon />
          </div>
          <div className="rv-identity-text">
            <div className="rv-tags" aria-label="Report categories">
              <span className="rv-tag">Research</span>
              <span className="rv-tag">AI Tools</span>
              <span className="rv-tag">2026</span>
            </div>
            <h2 className="rv-title" id="rv-title">{REPORT_INFO.title}</h2>
            <p className="rv-meta">
              <span className="rv-meta-item">📅 {REPORT_INFO.date}</span>
              <span className="rv-meta-dot" aria-hidden="true">·</span>
              <span className="rv-meta-item">📄 PDF · 3 pages</span>
            </p>
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="rv-divider" aria-hidden="true" />

        {/* ── AI summary section ─────────────────────────────────────────── */}
        <div className="rv-summary-section">
          <div className="rv-summary-label-row">
            <span className="rv-summary-label">✨ AI Executive Summary</span>
            <span className="rv-summary-powered">Powered by Claude</span>
          </div>

          {/* Loading skeleton */}
          {status === 'loading' && (
            <div className="rv-loading" aria-live="polite" aria-busy="true">
              <span className="spinner" aria-hidden="true" />
              <span className="rv-loading-text">Claude is reading the report…</span>
            </div>
          )}

          {/* Summary bullets */}
          {status === 'success' && summary.length > 0 && (
            <ul className="rv-bullets" aria-live="polite">
              {summary.map((line, i) => (
                <li key={i} className="rv-bullet">{line}</li>
              ))}
            </ul>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="rv-error" aria-live="polite">
              <p className="rv-error-text">⚠️ {error}</p>
              <button className="rv-retry-btn" onClick={loadSummary}>
                ↺ Try Again
              </button>
            </div>
          )}
        </div>

        {/* ── Action buttons ─────────────────────────────────────────────── */}
        <div className="rv-actions">
          {/* Primary — opens PDF in a new tab */}
          <a
            href={PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rv-open-btn"
            aria-label="Open full PDF in a new browser tab"
          >
            <PdfIcon size={18} />
            Open Full PDF
            <ExternalIcon />
          </a>

          {/* Secondary — close */}
          <button className="rv-close-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  )
}

/* ── SVG icon components ──────────────────────────────────────────────────── */

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  )
}

function PdfIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
