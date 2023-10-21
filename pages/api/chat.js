import { createParser } from "eventsource-parser";

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not POST' });
    }

    const { messages } = req.body;

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

                if (!json.choices || json.choices.length === 0) {
                    throw new Error('Unexpected data structure');
                }

                const text = json.choices[0]?.delta?.content || "";
                const queue = encoder.encode(text);
                controller.enqueue(queue);
            } catch (e) {
                throw e;
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
    return res.status(500).json({ message: `Error in handler: ${error.message}` });
  }
}
