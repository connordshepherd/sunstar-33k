import { StreamingTextResponse, AIStream } from 'ai'; // Corrected imports

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

        // Construct the stream
        const stream = AIStream(fetchResponse, token => token, {
            onStart: async () => {
                console.log('Stream started');
            },
            onToken: async token => {
                console.log('Received chunk:', token);
            },
            onFinal: async () => {
                console.log('Stream completed');
            },
        });

        // Return the StreamingTextResponse
        return new StreamingTextResponse(stream); // Use the SDK's utility

    } catch (error) {
        console.log(`Error in handler: ${error.message}`);
        return res.status(500).json({ message: `Error in handler: ${error.message}` });
    }
}
