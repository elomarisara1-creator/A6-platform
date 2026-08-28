const CHAPTERS = [
  { id: 'ch1', number: '1', title: 'Article 6 Framework Morocco', folderId: '1JkAvNUSvSi6dwTSz_NWk0U_Png1Hknvl' },
  { id: 'ch2', number: '2', title: 'Fee Structure', folderId: '1eu1VKzNDIzXbvzGvJdZNnN1mxT2nghwM' },
  { id: 'ch3', number: '3', title: 'Corresponding Adjustment', folderId: '1VqjzYC_Ct3E61m0jHRqrLSG4jLADqAM5' },
  { id: 'ch4', number: '4', title: 'Overselling Risk Strategy', folderId: '1wO8MLt-id5iKZbrfxvzzzJcvR6VbdEXq' },
  { id: 'ch5', number: '5', title: 'Climate Change Law Morocco', folderId: '1bH3cqrPWoM_lSF5Uo5bHmng3iThAT46H' },
  { id: 'ch6', number: '6', title: 'General Knowledge', folderId: '1bNCbfa6eY5RZKQ0HVXusz7az-ruYHxS_' },
];

async function getAccessToken() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url');

  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(key.private_key, 'base64url');
  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}

async function listFiles(folderId, token) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return data.files || [];
}

async function getFileText(file, token) {
  try {
    let url;
    if (file.mimeType === 'application/vnd.google-apps.document') {
      url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
    } else {
      url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
    }
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const text = await res.text();
    return text.slice(0, 15000);
  } catch {
    return '';
  }
}

export async function getChapterContent(chapterId) {
  const chapter = CHAPTERS.find(c => c.id === chapterId);
  if (!chapter) return '';
  try {
    const token = await getAccessToken();
    const files = await listFiles(chapter.folderId, token);
    const texts = await Promise.all(files.map(f => getFileText(f, token)));
    return texts.filter(Boolean).join('\n\n---\n\n');
  } catch (e) {
    console.error('Drive error:', e);
    return '';
  }
}

export { CHAPTERS };
