/**
 * Vercel Serverless Function: /api/generate-tip
 *
 * Calls the Anthropic Messages REST API directly (no SDK dependency) to
 * generate a short motivational tip for a given task.
 *
 * Using raw fetch instead of @anthropic-ai/sdk eliminates any SDK version
 * or module-resolution issues in the Vercel serverless environment.
 *
 * Environment variables required:
 *   ANTHROPIC_API_KEY  — set in Vercel dashboard → Settings → Environment Variables
 *
 * Anthropic REST API reference:
 *   https://docs.anthropic.com/en/api/messages
 */

/**
 * Model to use.
 * claude-haiku-4-5 is the fastest and most affordable current Claude model —
 * ideal for short motivational tips. See all current IDs at:
 * https://platform.claude.com/docs/en/docs/about-claude/models
 *
 * Current model IDs (March 2026):
 *   claude-haiku-4-5    ← used here — fastest, cheapest ($1/$5 per MTok)
 *   claude-sonnet-4-6   ← best speed/intelligence balance
 *   claude-opus-4-6     ← most powerful, highest cost
 */
const MODEL   = 'claude-haiku-4-5';

/** Anthropic Messages endpoint */
const API_URL = 'https://api.anthropic.com/v1/messages';

/** Anthropic API version header (required) */
const API_VER = '2023-06-01';

export default async function handler(req, res) {

  // ── 1. Method guard ──────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // ── 2. Input validation ──────────────────────────────────────────────────
  const { task } = req.body ?? {};
  if (!task || typeof task !== 'string' || !task.trim()) {
    return res.status(400).json({ error: 'A valid "task" string is required.' });
  }

  // ── 3. API-key guard ─────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[generate-tip] ANTHROPIC_API_KEY is not set in environment.');
    return res.status(500).json({
      error: 'Server config error: ANTHROPIC_API_KEY is missing. Set it in Vercel → Settings → Environment Variables, then redeploy.',
    });
  }

  // ── 4. Call Anthropic REST API directly (no SDK) ─────────────────────────
  let anthropicRes;
  try {
    anthropicRes = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,
        'anthropic-version': API_VER,
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content:
              `You are an enthusiastic productivity coach. Give me ONE short, fun, and specific ` +
              `motivational tip (2–3 sentences max) to help me complete this task: "${task.trim()}". ` +
              `Be encouraging, creative, and a little playful. Plain text only — no bullet points or headers.`,
          },
        ],
      }),
    });
  } catch (networkErr) {
    // fetch() itself threw — network-level failure
    console.error('[generate-tip] Network error reaching Anthropic:', networkErr.message);
    return res.status(502).json({
      error: `Network error: could not reach Anthropic API. ${networkErr.message}`,
    });
  }

  // ── 5. Parse and forward the response ────────────────────────────────────
  const data = await anthropicRes.json().catch(() => ({}));

  if (!anthropicRes.ok) {
    // Log the full Anthropic error server-side for debugging
    console.error('[generate-tip] Anthropic API error:', {
      status:  anthropicRes.status,
      type:    data?.error?.type,
      message: data?.error?.message,
    });

    // Map Anthropic HTTP status codes to friendly client messages
    switch (anthropicRes.status) {
      case 401:
        return res.status(401).json({
          error: 'Invalid API key — check ANTHROPIC_API_KEY in Vercel Environment Variables.',
        });
      case 403:
        return res.status(403).json({
          error: 'API key does not have permission to use this model. Check your Anthropic account tier.',
        });
      case 404:
        return res.status(404).json({
          error: `Anthropic says model not found: "${MODEL}". Raw message: ${data?.error?.message ?? 'none'}`,
        });
      case 429:
        return res.status(429).json({
          error: 'Rate limit or quota exceeded. Wait a moment and try again.',
        });
      case 529:
        return res.status(503).json({
          error: 'Anthropic API is temporarily overloaded. Try again in a few seconds.',
        });
      default:
        return res.status(anthropicRes.status).json({
          error: `Anthropic error ${anthropicRes.status}: ${data?.error?.message ?? 'Unknown error'}`,
        });
    }
  }

  // ── 6. Extract and return the tip text ───────────────────────────────────
  const tip = (data.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block)   => block.text)
    .join(' ')
    .trim();

  return res.status(200).json({ tip });
}
