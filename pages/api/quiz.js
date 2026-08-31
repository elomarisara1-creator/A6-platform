import { getChapterContent, CHAPTERS } from '../../lib/drive';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { chapterId, language = 'en' } = req.body;

  const chapter = CHAPTERS.find(c => c.id === chapterId);
  if (!chapter) return res.status(400).json({ error: 'Invalid chapter' });

  const content = await getChapterContent(chapterId);

  const langInstruction = language === 'fr'
    ? 'Generate the quiz entirely in French including questions, options, and explanations.'
    : 'Generate the quiz in English.';

  const prompt = `You are a quiz generator for Article 6 of the Paris Agreement capacity building.

${langInstruction}

${content ? `Use this content to generate questions:\n\n${content}` : `Use your expert knowledge about "${chapter.title}" and Article 6 of the Paris Agreement.`}

Generate 5 multiple choice questions about "${chapter.title}".

Respond in raw JSON only:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}

Rules:
- Each question has exactly 4 options
- "correct" is the index (0-3) of the correct option
- Questions should test real understanding, not just memorization
- Vary difficulty from basic to advanced
- Always return exactly 5 questions`;

  try {
    const model = 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { return res.status(500).json({ error: 'Failed to parse quiz' }); }
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
