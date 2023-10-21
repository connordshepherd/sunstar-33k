import { createParser } from "eventsource-parser";
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

    // If fetchResponse is not OK, return the HTTP status we got from Baseplate
    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({ message: `Received status ${fetchResponse.status} from Baseplate.` });
    }

    // Use a pass-through stream to pipe the Baseplate response directly
    const stream = new PassThrough();

    // Set the response headers
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    // Pipe the Baseplate response through the pass-through stream and to the response
    fetchResponse.body.pipe(stream).pipe(res);

  } catch (error) {
    return res.status(500).json({ message: `Error in handler: ${error.message}` });
  }
}
