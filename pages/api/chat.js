export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method not allowed');
  }

  // Just respond with a hardcoded message
  return res.status(200).send('Hello from the server!');
}
