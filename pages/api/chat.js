export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, language = 'en', docsText = '' } = req.body;

  const langInstruction = language === 'fr'
    ? 'You MUST respond entirely in French. All text including follow-up questions must be in French.'
    : 'Respond in English.';

  const docsContext = docsText
    ? `Use this knowledge base to answer questions:\n\n${docsText}`
    : 'Use your expert knowledge on Article 6 of the Paris Agreement.';

  const systemPrompt = `You are an expert on Article 6 of the Paris Agreement covering carbon markets, ITMOs, the Sustainable Development Mechanism (SDM), and non-market approaches.

${langInstruction}
${docsContext}

Always respond in this EXACT JSON format (raw JSON only, no markdown):
{
  "answer": "Your detailed expert answer here",
  "sources": ["source or document section you referenced"],
  "followUpQuestions": ["Question 1?", "Question 2?", "Question 3?"]
}

Be precise about: Article 6.2 (bilateral cooperative approaches), Article 6.4 (SDM), Article 6.8 (non-market approaches). Always provide exactly 3 follow-up questions.`;

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const lastMessage = messages[messages.length - 1];

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [...history, { role: 'user', parts: [{ text: lastMessage.content }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );

    const data = await response.json();

    if (!response.ok) throw new Error(data.error?.message || 'Gemini API error');

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { answer: raw, sources: [], followUpQuestions: [] };
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
