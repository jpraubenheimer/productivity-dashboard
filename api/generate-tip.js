/**
 * Vercel Serverless Function: /api/generate-tip
 *
 * Receives a task name via POST, calls the Claude API (claude-3-5-sonnet-20240620),
 * and returns a short, fun motivational tip for completing that task.
 *
 * The API key lives only in the server environment — it is never
 * exposed to the browser.
 *
 * Environment variables required:
 *   ANTHROPIC_API_KEY  — set in .env.local (dev) or Vercel dashboard (prod)
 *
 * Error codes surfaced to the client:
 *   400  — missing / invalid task body
 *   401  — invalid or missing Anthropic API key
 *   404  — model not found (wrong model ID)
 *   429  — rate-limited or quota exceeded
 *   500  — all other unexpected server errors
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude model to use.
 *
 * NOTE ON MODEL ID FORMAT:
 *   The Anthropic API uses hyphens — NOT periods — in all model IDs.
 *   Marketing name  →  "Claude 3.5 Sonnet"
 *   API model ID    →  "claude-3-5-sonnet-20240620"  (period becomes hyphen)
 *
 * Available snapshots (see https://docs.anthropic.com/en/docs/about-claude/models):
 *   claude-3-5-sonnet-20240620   ← used here (Jun 2024)
 *   claude-3-5-sonnet-20241022   ← newer snapshot (Oct 2024)
 *   claude-3-haiku-20240307      ← fastest / cheapest option
 */
const MODEL = 'claude-3-5-sonnet-20240620';

export default async function handler(req, res) {
  // ── 1. Method guard ───────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // ── 2. Input validation ───────────────────────────────────────────────────
  const { task } = req.body ?? {};

  if (!task || typeof task !== 'string' || task.trim().length === 0) {
    return res.status(400).json({ error: 'A valid "task" string is required in the request body.' });
  }

  // ── 3. API-key guard ──────────────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[generate-tip] ANTHROPIC_API_KEY environment variable is not set.');
    return res.status(401).json({
      error: 'Invalid API key — ANTHROPIC_API_KEY is missing. Add it in your Vercel environment variables.',
    });
  }

  // ── 4. Call Claude ────────────────────────────────────────────────────────
  try {
    const client = new Anthropic();

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content:
            `You are an enthusiastic productivity coach. Give me ONE short, fun, and specific ` +
            `motivational tip (2–3 sentences max) to help me complete this task: "${task.trim()}". ` +
            `Be encouraging, creative, and a little playful. Do not use bullet points or headers — just plain text.`,
        },
      ],
    });

    // Extract the plain-text response from Claude's content blocks
    const tip = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join(' ')
      .trim();

    return res.status(200).json({ tip });

  } catch (error) {
    // ── 5. Granular error handling ─────────────────────────────────────────
    // Log the full error on the server for debugging
    console.error('[generate-tip] Claude API error:', {
      status: error?.status,
      message: error?.message,
      error_type: error?.error?.type,
    });

    // 401 — Bad or missing API key
    if (error?.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key — check that ANTHROPIC_API_KEY is set correctly in Vercel.',
      });
    }

    // 404 — Model ID not recognised by the API
    if (error?.status === 404) {
      return res.status(404).json({
        error: `Model not found: "${MODEL}". Check the model ID in api/generate-tip.js.`,
      });
    }

    // 429 — Rate-limited or monthly quota exceeded
    if (error?.status === 429) {
      const isQuota = error?.error?.type === 'rate_limit_error';
      return res.status(429).json({
        error: isQuota
          ? 'Anthropic quota exceeded — upgrade your plan or wait for the limit to reset.'
          : 'Rate limit reached. Please wait a moment and try again.',
      });
    }

    // 529 — Anthropic API overloaded
    if (error?.status === 529) {
      return res.status(503).json({
        error: 'Anthropic API is temporarily overloaded. Please try again in a few seconds.',
      });
    }

    // Catch-all for unexpected errors
    return res.status(500).json({
      error: `Unexpected error (${error?.status ?? 'unknown'}): ${error?.message ?? 'Please try again.'}`,
    });
  }
}
