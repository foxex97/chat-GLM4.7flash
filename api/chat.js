export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Get the API Key from Environment Variables (Secure)
  const apiKey = process.env.ZHIPU_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key missing in server env' });
  }

  try {
    // 3. Forward the request to Zhipu AI
    const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept-Language': 'en-US,en'
      },
      body: JSON.stringify({
        model: req.body.model || 'glm-4-flash',
        messages: req.body.messages,
        stream: true
      })
    });

    // 4. Stream the response back to the user
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
