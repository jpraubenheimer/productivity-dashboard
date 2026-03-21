/**
 * Vercel Serverless Function: /api/summarize-report
 *
 * Returns a Claude-generated summary of the latest research report.
 * The report text is embedded directly in this file (extracted from the PDF),
 * so no filesystem access or PDF parsing is needed at runtime.
 *
 * GET /api/summarize-report
 *   → { summary: string, report: { title, date, filename } }
 *
 * Environment variables required:
 *   ANTHROPIC_API_KEY — set in Vercel dashboard → Settings → Environment Variables
 */

/** Anthropic REST API config */
const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VER = '2023-06-01';
const MODEL   = 'claude-haiku-4-5';

/**
 * Metadata for the latest report.
 * Update this object (and REPORT_TEXT below) whenever a new PDF is added
 * to public/reports/ and deployed.
 */
const LATEST_REPORT = {
  title:    'Best Productivity Tools 2026',
  date:     'March 21, 2026',
  filename: 'research-report-best-productivity-tools-2026.pdf',
};

/**
 * Full text content extracted from the PDF at build time.
 * Embedding the text here avoids any runtime PDF-parsing dependency
 * and works seamlessly in Vercel's serverless environment.
 */
const REPORT_TEXT = `
RESEARCH REPORT — Best Productivity Tools 2026
Generated: March 21, 2026

OVERVIEW
The productivity software landscape in 2026 is defined by one dominant theme: artificial intelligence
is no longer an add-on feature — it is the core of how leading tools operate. AI-powered scheduling
assistants, intelligent workspaces, and multi-agent automation systems have moved from
experimental to mainstream, reshaping how individuals and teams manage their time, knowledge,
and workflows.

The global AI productivity tools market is valued at $13.6 billion in 2025 and is projected to reach
$17 billion by the end of 2026, growing at a 25% CAGR. By 2030, analysts expect the market to
surpass $41 billion. This growth is driven by enterprise adoption of automation, the rise of remote
and hybrid work, and a broad shift toward cloud-based collaboration platforms.

The top tools of 2026 fall into five categories: AI scheduling assistants (Motion, Reclaim, Clockwise),
all-in-one project workspaces (Notion, ClickUp), task and project management platforms (Asana,
monday.com), communication tools (Slack, Loom), and automation connectors (Zapier). A critical
counter-narrative is emerging: tool overload and AI-induced workload intensification pose genuine
risks to sustainable productivity.

KEY FINDINGS
• AI scheduling tools are the breakout category of 2026. Motion, Reclaim, and Clockwise use AI to
  auto-schedule tasks, protect focus time, and reorganize calendars dynamically. Reclaim reports a
  44% improvement in time management and 9.8 additional focus hours per week for users.
• The AI productivity tools market is growing at 25% CAGR, from $13.6B in 2025 to $17B in 2026.
• All-in-one workspaces (Notion, ClickUp) dominate knowledge management and project
  coordination. ClickUp integrates with 7,000+ third-party apps.
• Multi-agent AI systems are emerging as 'digital coworkers,' allowing small teams to orchestrate
  complex, cross-tool workflows without manual intervention.
• Tool overload is a documented productivity killer. An Anthropic study found that heavy AI
  assistance reduced user comprehension scores by 17%.

PROS / BENEFITS
• Significant time savings: AI scheduling tools report 5–9 hours of reclaimed time per week.
• Reduced context-switching: All-in-one platforms cut the cognitive cost of jumping between apps.
• Scalability for small teams: Multi-agent AI systems allow 2–3 person teams to execute at scale.
• Seamless remote collaboration: Cloud-based tools enable distributed teams across time zones.
• Automation of repetitive work: Tools like Zapier eliminate manual data entry and handoffs.

CONS / CHALLENGES
• Tool overload paradox: Adopting too many tools often decreases actual output.
• AI workload intensification: A Feb 2026 Harvard Business Review analysis found AI can intensify
  work by generating tasks faster than humans can process them, leading to burnout.
• Skills degradation: Over-reliance on AI for cognitive tasks reduced comprehension by 17%.
• Subscription cost creep: Best-in-class tool stacks can exceed $100–200/month per user.
• Privacy and data security risks: AI tools processing sensitive data in the cloud introduce exposure.

CONCLUSION
The best productivity tools in 2026 are those that reduce friction rather than add it. A focused stack
of 3–4 well-integrated tools will outperform a bloated suite of a dozen apps. Top tools: Motion (AI
scheduling), Notion (knowledge management), ClickUp (team workflows), Reclaim (calendar
optimization), and Zapier (automation).

By 2027–2028, the most effective teams will have built clear human-AI workflows, with AI handling
scheduling, research synthesis, and routine execution, while humans focus on judgment, creativity,
and relationship-driven work.
`.trim();

export default async function handler(req, res) {
  // ── 1. Method guard — allow GET and POST ─────────────────────────────────
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  // ── 2. API-key guard ──────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[summarize-report] ANTHROPIC_API_KEY is not set.');
    return res.status(500).json({
      error: 'Server config error: ANTHROPIC_API_KEY is missing.',
    });
  }

  // ── 3. Call Claude for a fresh, insightful summary ────────────────────────
  let anthropicRes;
  try {
    anthropicRes = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': API_VER,
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content:
              `You are a sharp, concise research analyst. Based on the following research report, ` +
              `write a punchy executive summary in 4–5 bullet points. Each bullet should be one ` +
              `clear, actionable insight. Use plain text — no markdown headers, just • bullets.\n\n` +
              `REPORT:\n${REPORT_TEXT}`,
          },
        ],
      }),
    });
  } catch (networkErr) {
    console.error('[summarize-report] Network error:', networkErr.message);
    return res.status(502).json({
      error: `Network error reaching Anthropic: ${networkErr.message}`,
    });
  }

  // ── 4. Parse Anthropic response ───────────────────────────────────────────
  const data = await anthropicRes.json().catch(() => ({}));

  if (!anthropicRes.ok) {
    console.error('[summarize-report] Anthropic error:', {
      status:  anthropicRes.status,
      type:    data?.error?.type,
      message: data?.error?.message,
    });

    switch (anthropicRes.status) {
      case 401:
        return res.status(401).json({ error: 'Invalid API key.' });
      case 429:
        return res.status(429).json({ error: 'Rate limit reached. Try again shortly.' });
      default:
        return res.status(anthropicRes.status).json({
          error: `Anthropic error ${anthropicRes.status}: ${data?.error?.message ?? 'Unknown'}`,
        });
    }
  }

  // ── 5. Extract and return summary + report metadata ───────────────────────
  const summary = (data.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block)   => block.text)
    .join(' ')
    .trim();

  return res.status(200).json({ summary, report: LATEST_REPORT });
}
