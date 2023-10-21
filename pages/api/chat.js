import { PassThrough } from 'stream';

export default async function handler(req, res) {
  try {
    console.log("Function started");

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

    console.log("Baseplate fetch done");

    // If fetchResponse is not OK, return the HTTP status we got from Baseplate
    if (!fetchResponse.ok) {
      console.log("Baseplate fetch not OK");
      return res.status(fetchResponse.status).json({ message: `Received status ${fetchResponse.status} from Baseplate.` });
    }

    // Try to grab a chunk of data from the stream and log it
    let chunks = [];
    for await (const chunk of fetchResponse.body) {
      chunks.push(chunk);
      if (chunks.length > 1) break;  // we only want to accumulate a few chunks
    }

    const buffer = Buffer.concat(chunks);
    console.log("Received from Baseplate:", buffer.toString('utf-8'));

    // Return early to see if the function gets this far
    return res.status(200).json({ message: "Got till here!" });

  } catch (error) {
    console.error("Error in function:", error.message);
    return res.status(500).json({ message: `Error in handler: ${error.message}` });
  }
}
