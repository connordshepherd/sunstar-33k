import { AIStream, type AIStreamParser, type AIStreamCallbacks } from 'ai';

// Simple passthrough parser - just returns the chunk as is.
function passthroughStream() {
    return data => data;
}

function StreamingTextResponse(stream) {
    // Construct and return a readable stream from the given stream
    const readable = new Readable({
        async read() {
            for await (const chunk of stream) {
                this.push(chunk);
            }
            this.push(null);
        }
    });
    return readable;
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

        // Construct the stream
        const stream = AIStream(fetchResponse, passthroughStream(), {
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
        return StreamingTextResponse(stream);

    } catch (error) {
        console.log(`Error in handler: ${error.message}`);
        return res.status(500).json({ message: `Error in handler: ${error.message}` });
    }
}
