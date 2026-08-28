export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { messages, language = 'en', chapterContent = '', chapterName = '' } = req.body;
  const langInstruction = language === 'fr' ? 'Respond entirely in French.' : 'Respond in English.';
  const docsContext = chapterContent
    ? `You are answering questions about the chapter "${chapterName}". Use this content:\n\n${chapterContent}`
    : `Use your expert knowledge on Article 6 of the Paris Agreement.`;
  const systemPrompt = `You are an expert on Article 6 of the Paris Agreement, carbon markets, ITMOs, SDM, and non-market approaches, with specific expertise on Morocco. ${langInstruction} ${docsContext} Always respond in raw JSON only: {"answer":"...","sources":["..."],"followUpQuestions":["...","...","..."]}`;
  const history = messages.slice(0, -1).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const last = messages[messages.length - 1];
  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [...history, { role: 'user', parts: [{ text: last.content }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
  };
  try {
    const key = process.env.GEMINI_API_KEY;
    const model = "gemini-3.6-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { parsed = { answer: raw, sources: [], followUpQuestions: [] }; }
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
