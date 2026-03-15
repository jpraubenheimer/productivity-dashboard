/**
 * Vercel Serverless Function: /api/generate-tip
 *
 * Receives a task name via POST, calls the Claude API (claude-opus-4-6),
 * and returns a short, fun motivational tip for completing that task.
 *
 * The API key lives only in the server environment — it is never
 * exposed to the browser.
 *
 * Environment variables required:
 *   ANTHROPIC_API_KEY  — set in .env.local (dev) or Vercel dashboard (prod)
 */

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { task } = req.body;

  // Validate input
  if (!task || typeof task !== 'string' || task.trim().length === 0) {
    return res.status(400).json({ error: 'A valid task string is required.' });
  }

  // Guard: ensure the API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'Server configuration error: missing API key.' });
  }

  try {
    // Initialise the Anthropic client (reads ANTHROPIC_API_KEY from environment)
    const client = new Anthropic();

    // Call claude-opus-4-6 for a punchy motivational tip
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `You are an enthusiastic productivity coach. Give me ONE short, fun, and specific motivational tip (2–3 sentences max) to help me complete this task: "${task.trim()}". Be encouraging, creative, and a little playful. Do not use bullet points or headers — just plain text.`,
        },
      ],
    });

    // Extract the text response from Claude's content blocks
    const tip = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join(' ')
      .trim();

    return res.status(200).json({ tip });
  } catch (error) {
    // Log the full error server-side but return a safe message to the client
    console.error('Claude API error:', error);

    // Surface Anthropic-specific rate limit / auth errors with a friendly message
    if (error?.status === 401) {
      return res.status(500).json({ error: 'Invalid Anthropic API key. Check your environment variable.' });
    }
    if (error?.status === 429) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
    }

    return res.status(500).json({ error: 'Failed to generate tip. Please try again.' });
  }
}
