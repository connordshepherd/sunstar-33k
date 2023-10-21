export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    // Extract necessary data from the request
    const { messages } = (await req.json());

    // Fetch request to Baseplate
    const fetchResponse = await fetch(process.env.BASEPLATE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BASEPLATE_API_KEY}`,
      },
      body: JSON.stringify({
        messages: messages,
        stream: true,
      }),
    });

    if (!fetchResponse.ok) {
      console.log(`Received status ${fetchResponse.status} from Baseplate.`);
      return new Response('Error', { status: fetchResponse.status, statusText: `Received status ${fetchResponse.status} from Baseplate.` });
    }

    // Directly use the fetchResponse body as the streaming response
    const stream = fetchResponse.body;

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500, statusText: error.message });
  }
};

export default handler;
