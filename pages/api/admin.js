export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { password, chapter, content } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  if (!chapter || !content) {
    return res.status(400).json({ error: 'Missing chapter or content' });
  }
  // Store in environment — for now return success
  // Content is managed client-side in localStorage per chapter
  return res.status(200).json({ success: true });
}
