import { createParser } from "eventsource-parser";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { messages } = req.body;

  try {
    const fetchResponse = await fetch(`${process.env.BASEPLATE_ENDPOINT}/completions`, {
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

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const stream = new ReadableStream({
      async start(controller) {
        function onParse(event) {
          if (event.type === "event") {
            const data = event.data;
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const text = json.choices[0]?.content || json.choices[0]?.text || "";
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              controller.error(e);
            }
          }
        }

        const parser = createParser(onParse);
        for await (const chunk of fetchResponse.body) {
          parser.feed(decoder.decode(chunk));
        }
      },
    });
    
    return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });

  } catch (error) {
    console.error('Error querying Baseplate:', error);
    return res.status(500).json({ error: 'Error querying Baseplate' });
  }
}
