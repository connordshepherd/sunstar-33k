import { createParser } from "eventsource-parser";

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

    // If fetchResponse is not OK, return the HTTP status we got from Baseplate
    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({ message: `Received status ${fetchResponse.status} from Baseplate.` });
    }

    // Simple stream to test if Vercel handles streaming properly
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("Testing streaming response."));
        controller.close();
      },
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });

    /* 
    // Commenting out the streaming and parsing logic for now
    // (the rest of your original code for streaming)
    */

  } catch (error) {
    return res.status(500).json({ message: `Error in handler: ${error.message}` });
  }
}
