const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL = 'glm-4.7-flash';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages required' });

  try {
    console.log('[chat] model:', MODEL, 'msgs:', messages.length);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        thinking: { type: 'enabled' },
        max_tokens: 65536,
        temperature: 1.0
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[chat] Z.ai error:', response.status, JSON.stringify(err));
      return res.status(response.status).json(err);
    }

    // Forward SSE stream to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (err) {
    console.error('[chat] Failed:', err);
    if (!res.headersSent) return res.status(500).json({ error: err.message });
    res.end();
  }
}
