import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const fetchResponse = await fetch(`${process.env.BASEPLATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BASEPLATE_API_KEY}`,
      },
      body: JSON.stringify({
        messages: body.messages,
        stream: true,
      }),
    });

    if (!fetchResponse.ok) {
      console.log(`Received status ${fetchResponse.status} from Baseplate.`);
      return new Response('Error', { status: fetchResponse.status, statusText: `Received status ${fetchResponse.status} from Baseplate.` });
    }

    const stream = new ReadableStream({
      async start(controller) {
        function onParse(event: ParsedEvent | ReconnectInterval) {
          if (event.type === "event") {
            const data = event.data;
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const text = json.choices[0].delta?.content || json.choices[0].text || "";
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              controller.error(e);
            }
          }
        }

        const parser = createParser(onParse);
        for await (const chunk of fetchResponse.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500, statusText: error.message });
  }
};

export default handler;
