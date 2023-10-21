// Required imports
import { AIStream, AIStreamParser, AIStreamCallbacks } from 'ai'; // Adjust import path as needed

// Custom parser function for Baseplate
function parseBaseplateStream(): AIStreamParser {
  return data => {
    // Assuming Baseplate returns plain text chunks
    return data;
  };
}

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

    // Use AIStream with your custom parser
    const baseplateStream = AIStream(fetchResponse, parseBaseplateStream(), {
      onStart: async () => {
        console.log('Stream started');
      },
      onCompletion: async completion => {
        res.write(completion);
      },
      onFinal: async completion => {
        console.log('Stream completed', completion);
        res.end();
      },
      // Assuming Baseplate doesn't return tokenized data
      // onToken: async token => {},
    });

    // The readable stream (baseplateStream) will handle data processing and streaming

  } catch (error) {
    return res.status(500).json({ message: `Error in handler: ${error.message}` });
  }
}
