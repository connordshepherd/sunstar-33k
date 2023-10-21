import { AIStream } from 'ai';

// Simple passthrough parser - just returns the chunk as is.
function passthroughStream() {
  return data => data;
}

function BaseplateStream(res, cb) {
  return AIStream(res, passthroughStream(), cb);
}

export default async function handler(req, res) {
  try {
    // Ensure it's a POST request
    if (req.method !== 'POST') {
      console.log("Method not POST");
      return res.status(405).json({ message: 'Method not POST' });
    }

    // Fetch request to Baseplate
    const fetchResponse = await fetch(process.env.BASEPLATE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BASEPLATE_API_KEY}`
      },
      body: JSON.stringify({
        messages: req.body.messages,
        stream: true,
      }),
    });

    if (!fetchResponse.ok) {
      console.log(`Received status ${fetchResponse.status} from Baseplate.`);
      return res.status(fetchResponse.status).json({ message: `Received status ${fetchResponse.status} from Baseplate.` });
    }

    // Using AIStream
    const baseplateStream = BaseplateStream(fetchResponse, {
      onStart: async () => {
        console.log('Stream started');
      },
      onToken: async token => {
        console.log('Received chunk:', token);
        res.write(token);
        // For testing, keep the delay to simulate chunked transfer
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      },
      onFinal: async () => {
        console.log('Stream completed');
        res.end();
      },
    });

    // Set the required headers for chunked transfer
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;

    // Remove Content-Length header if present
    if (res.hasHeader('Content-Length')) {
      res.removeHeader('Content-Length');
    }

  } catch (error) {
    console.log(`Error in handler: ${error.message}`);
    return res.status(500).json({ message: `Error in handler: ${error.message}` });
  }
}
