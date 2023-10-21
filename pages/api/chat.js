import { PassThrough } from 'stream';

export default async function handler(req, res) {
  try {
    // Ensure it's a POST request
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not POST' });
    }

    const { messages } = req.body;

    // Fetch request to Baseplate
    const fetchResponse = await fetch(process.env.BASEPLATE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BASEPLATE_API_KEY}`
      },
      body: JSON.stringify({
        messages: messages,
        stream: true,
      }),
    });

    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({ message: `Received status ${fetchResponse.status} from Baseplate.` });
    }

    // Set headers for streaming
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;

    // Send chunks as they arrive
    for await (const chunk of fetchResponse.body) {
      res.write(chunk);
      // Introduce a delay for testing; remove this in production
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
    }

    res.end();

  } catch (error) {
    return res.status(500).json({ message: `Error in handler: ${error.message}` });
  }
}
