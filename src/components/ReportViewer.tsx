/**
 * ReportViewer component
 *
 * A full-screen modal that:
 *   1. Embeds the latest research report PDF in an <iframe>
 *   2. Shows report metadata (title, date, filename)
 *   3. Offers an "AI Summary" button that calls /api/summarize-report
 *      and displays a Claude-generated executive summary
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

type SummaryStatus = 'idle' | 'loading' | 'success' | 'error'

interface ReportViewerProps {
  onClose: () => void
}

export default function ReportViewer({ onClose }: ReportViewerProps) {
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus>('idle')
  const [summary,       setSummary]       = useState<string | null>(null)
  const [reportMeta,    setReportMeta]    = useState<ReportMeta | null>(null)

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  /**
   * Fetch a Claude-generated summary from the serverless function.
   * Stores both the summary text and report metadata returned by the API.
   */
  const fetchSummary = useCallback(async () => {
    setSummaryStatus('loading')
    setSummary(null)

    try {
      const res  = await fetch('/api/summarize-report')
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Unknown error')

      setSummary(data.summary)
      setReportMeta(data.report)
      setSummaryStatus('success')
    } catch (err) {
      console.error('Failed to fetch summary:', err)
      setSummary(err instanceof Error ? err.message : 'Failed to load summary.')
      setSummaryStatus('error')
    }
  }, [])

  /** PDF path served as a static asset from /public/reports/ */
  const pdfPath = '/reports/research-report-best-productivity-tools-2026.pdf'

  return (
    /* Backdrop — click outside to close */
    <div
      className="report-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Research Report Viewer"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="report-modal">

        {/* ── Modal header ─────────────────────────────────────────────── */}
        <div className="report-modal-header">
          <div className="report-modal-title-row">
            <span className="report-modal-icon" aria-hidden="true">📄</span>
            <div>
              <h2 className="report-modal-title">Latest Research Report</h2>
              <p className="report-modal-subtitle">
                {reportMeta
                  ? `${reportMeta.title} · ${reportMeta.date}`
                  : 'Best Productivity Tools 2026 · March 21, 2026'}
              </p>
            </div>
          </div>

          <button
            className="report-close-btn"
            onClick={onClose}
            aria-label="Close report viewer"
            title="Close (Esc)"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Body: PDF viewer + AI summary panel ──────────────────────── */}
        <div className="report-modal-body">

          {/* Left / top: PDF iframe */}
          <div className="report-pdf-panel">
            <iframe
              src={`${pdfPath}#toolbar=1&navpanes=0`}
              title="Research Report PDF"
              className="report-pdf-iframe"
              aria-label="Research report PDF document"
            />
            {/* Fallback link for browsers that block iframes */}
            <p className="report-pdf-fallback">
              Can't see the PDF?{' '}
              <a href={pdfPath} target="_blank" rel="noopener noreferrer">
                Open in new tab ↗
              </a>
            </p>
          </div>

          {/* Right / bottom: AI summary panel */}
          <div className="report-summary-panel">
            <div className="report-summary-header">
              <span className="report-summary-label">🤖 AI Executive Summary</span>
              <span className="report-summary-sub">Powered by Claude</span>
            </div>

            {/* Idle state — prompt user to generate */}
            {summaryStatus === 'idle' && (
              <div className="report-summary-idle">
                <p className="report-summary-idle-text">
                  Click below to get an AI-generated executive summary of this report.
                </p>
                <button
                  className="report-summary-btn"
                  onClick={fetchSummary}
                >
                  ✨ Generate Summary
                </button>
              </div>
            )}

            {/* Loading */}
            {summaryStatus === 'loading' && (
              <div className="report-summary-loading" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                <span>Claude is reading the report…</span>
              </div>
            )}

            {/* Success */}
            {summaryStatus === 'success' && summary && (
              <div className="report-summary-result" aria-live="polite">
                <div className="report-summary-text">
                  {/* Render each bullet as its own line */}
                  {summary.split('\n').filter(Boolean).map((line, i) => (
                    <p key={i} className="report-summary-line">{line}</p>
                  ))}
                </div>
                <button
                  className="report-summary-btn report-summary-btn-sm"
                  onClick={fetchSummary}
                  title="Regenerate summary"
                >
                  ↺ Regenerate
                </button>
              </div>
            )}

            {/* Error */}
            {summaryStatus === 'error' && (
              <div className="report-summary-error" aria-live="polite">
                <p className="report-summary-error-text">⚠️ {summary}</p>
                <button className="report-summary-btn" onClick={fetchSummary}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** ✕ close icon */
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6"  y1="6" x2="18" y2="18" />
    </svg>
  )
}
