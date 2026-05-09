const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL = 'glm-4.7-flash'; // <-- Fixed: use the model name you specified

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    console.error('[api/chat] ZAI_API_KEY env var is not set');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  // Debug endpoint: GET /api/chat?action=models — lists your available models
  if (req.method === 'GET' && req.query?.action === 'models') {
    try {
      const r = await fetch('https://open.bigmodel.cn/api/paas/v4/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await r.json();
      console.log('[api/chat] Models list:', JSON.stringify(data));
      return res.status(200).json(data);
    } catch (err) {
      console.error('[api/chat] Models fetch failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    console.log('[api/chat] Forwarding', messages.length, 'messages to Z.ai, model:', MODEL);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model: MODEL, messages })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[api/chat] Z.ai error:', response.status, JSON.stringify(data));
      return res.status(response.status).json(data);
    }

    console.log('[api/chat] Success, usage:', JSON.stringify(data.usage));
    return res.status(200).json(data);

  } catch (err) {
    console.error('[api/chat] Fetch failed:', err);
    return res.status(500).json({ error: err.message });
  }
}
