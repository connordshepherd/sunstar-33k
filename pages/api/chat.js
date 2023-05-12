import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { messages } = req.body;

  try {
    const response = await axios.post(
      process.env.BASEPLATE_ENDPOINT,
        {
          values: {
            question: messages[messages.length - 1]?.content || ''
          },
          messages: messages.map((message) => ({ role: message.role, content: message.content }))
        },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BASEPLATE_API_KEY}`
        }
      }
    );

    console.log('Baseplate response data:', response.data); // Added this line

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error querying Baseplate:', error);
    return res.status(500).json({ error: 'Error querying Baseplate' });
  }
}