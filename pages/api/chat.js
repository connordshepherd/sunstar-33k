import { createParser } from "eventsource-parser";

export default async function handler(req, res) {
  console.log("API handler started."); // Debugging statement

  if (req.method !== 'POST') {
    console.log("Method not POST."); // Debugging statement
    return res.status(405).end();
  }

  const { messages } = req.body;

  try {
    console.log("Sending request to Baseplate."); // Debugging statement

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

    console.log("Received response from Baseplate. Status:", fetchResponse.status); // Debugging statement

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        function onParse(event) {
          if (event.type === "event") {
            const data = event.data;
            console.log("Data received from Baseplate:", data); // Debugging statement

            if (data === "[DONE]") {
              console.log("Data DONE. Closing stream."); // Debugging statement
              controller.close();
              return;
            }

            try {
              const json = JSON.parse(data);
              const text = json.choices[0]?.delta?.content || "";
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              console.error('Error parsing data:', e);
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
    
    console.log("Returning response stream."); // Debugging statement
    return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });

  } catch (error) {
    console.error('Error querying Baseplate:', error);
    return res.status(500).json({ error: 'Error querying Baseplate' });
  }
}
