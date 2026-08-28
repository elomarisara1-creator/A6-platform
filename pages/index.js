import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

const CHAPTERS = [
  { id: 'ch1', number: '1', title: 'Article 6 Framework Morocco', icon: '📋' },
  { id: 'ch2', number: '2', title: 'Fee Structure', icon: '💰' },
  { id: 'ch3', number: '3', title: 'Corresponding Adjustment', icon: '⚖️' },
  { id: 'ch4', number: '4', title: 'Overselling Risk Strategy', icon: '📊' },
  { id: 'ch5', number: '5', title: 'Climate Change Law Morocco', icon: '🌍' },
];

const T = {
  en: {
    loginTitle: 'Article 6 Knowledge Platform',
    loginSub: 'Paris Agreement — Morocco Carbon Markets',
    loginBtn: 'Enter Platform',
    loginPlaceholder: 'Enter password',
    loginError: 'Incorrect password. Please try again.',
    placeholder: 'Ask a question about this chapter...',
    thinking: 'Analyzing...',
    sources: 'Sources',
    followUp: 'Suggested questions',
    langBtn: 'Français',
    uploadBtn: '📄 Upload Documents',
    uploadTitle: 'Upload Documents',
    uploadDesc: 'Open your PDF or Word document, select all text (Ctrl+A), copy (Ctrl+C), then paste below.',
    uploadPlaceholder: 'Paste document text here...',
    uploadSave: 'Save',
    uploadCancel: 'Cancel',
    uploadSaved: '✅ Saved',
    noDoc: 'No documents uploaded yet for this chapter. Click "Upload Documents" to add content.',
    welcome: 'Select a chapter from the sidebar and ask any question.',
    logout: 'Logout',
  },
  fr: {
    loginTitle: 'Plateforme de Connaissances Article 6',
    loginSub: 'Accord de Paris — Marchés Carbone Maroc',
    loginBtn: 'Accéder',
    loginPlaceholder: 'Entrez le mot de passe',
    loginError: 'Mot de passe incorrect. Veuillez réessayer.',
    placeholder: 'Posez une question sur ce chapitre...',
    thinking: 'Analyse en cours...',
    sources: 'Sources',
    followUp: 'Questions suggérées',
    langBtn: 'English',
    uploadBtn: '📄 Documents',
    uploadTitle: 'Télécharger des Documents',
    uploadDesc: 'Ouvrez votre PDF ou Word, sélectionnez tout (Ctrl+A), copiez (Ctrl+C), puis collez ci-dessous.',
    uploadPlaceholder: 'Collez le texte du document ici...',
    uploadSave: 'Sauvegarder',
    uploadCancel: 'Annuler',
    uploadSaved: '✅ Sauvegardé',
    noDoc: "Aucun document téléchargé pour ce chapitre. Cliquez sur 'Documents' pour ajouter du contenu.",
    welcome: 'Sélectionnez un chapitre dans la barre latérale et posez votre question.',
    logout: 'Déconnexion',
  },
};

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [lang, setLang] = useState('en');
  const [activeChapter, setActiveChapter] = useState(CHAPTERS[0]);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chapterDocs, setChapterDocs] = useState({});
  const [showUpload, setShowUpload] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadSaved, setUploadSaved] = useState(false);
  const [password, setPassword] = useState('');
  const bottomRef = useRef(null);
  const t = T[lang];

  useEffect(() => {
    const saved = localStorage.getItem('a6_docs');
    if (saved) setChapterDocs(JSON.parse(saved));
    const savedLang = localStorage.getItem('a6_lang');
    if (savedLang) setLang(savedLang);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const login = async () => {
    setPwError(false);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwInput, chapter: 'test', content: 'test' }),
      });
      if (res.ok) {
        setAuthed(true);
        setPassword(pwInput);
      } else {
        setPwError(true);
      }
    } catch {
      setPwError(true);
    }
  };

  const logout = () => {
    setAuthed(false);
    setPwInput('');
    setPassword('');
  };

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'fr' : 'en';
    setLang(newLang);
    localStorage.setItem('a6_lang', newLang);
  };

  const openUpload = () => {
    setUploadText(chapterDocs[activeChapter.id] || '');
    setShowUpload(true);
    setUploadSaved(false);
  };

  const saveUpload = () => {
    const updated = { ...chapterDocs, [activeChapter.id]: uploadText };
    setChapterDocs(updated);
    localStorage.setItem('a6_docs', JSON.stringify(updated));
    setUploadSaved(true);
    setTimeout(() => { setShowUpload(false); setUploadSaved(false); }, 1000);
  };

  const switchChapter = (ch) => {
    setActiveChapter(ch);
    setInput('');
  };

  const currentMessages = messages[activeChapter.id] || [];
  const currentDoc = chapterDocs[activeChapter.id] || '';

  const sendMsg = async (text) => {
    if (loading) return;
    const txt = text || input;
    if (!txt.trim()) return;
    const userMsg = { role: 'user', content: txt };
    const chId = activeChapter.id;
    const newMsgs = [...(messages[chId] || []), userMsg];
    setMessages(prev => ({ ...prev, [chId]: newMsgs }));
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          language: lang,
          chapterContent: currentDoc,
          chapterName: activeChapter.title,
        }),
      });
      const data = await res.json();
      setMessages(prev => ({ ...prev, [chId]: [...(prev[chId] || []), {
        role: 'assistant',
        content: data.answer || data.error || 'No response',
        sources: data.sources || [],
        followUpQuestions: data.followUpQuestions || [],
        isError: !!data.error,
      }]}));
    } catch {
      setMessages(prev => ({ ...prev, [chId]: [...(prev[chId] || []), {
        role: 'assistant', content: 'Connection error. Please try again.',
        sources: [], followUpQuestions: [], isError: true,
      }]}));
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  // LOGIN SCREEN
  if (!authed) {
    return (
      <>
        <Head>
          <title>{t.loginTitle}</title>
          <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet" />
        </Head>
        <div style={{ minHeight:'100vh', background:'#1a2744', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'Source Sans 3,sans-serif' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'40px', maxWidth:'420px', width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ textAlign:'center', marginBottom:'32px' }}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="#0a7ea4" strokeWidth="1.5" style={{ margin:'0 auto 16px', display:'block' }}>
                <circle cx="28" cy="28" r="26"/><ellipse cx="28" cy="28" rx="11" ry="26"/>
                <line x1="2" y1="28" x2="54" y2="28"/><line x1="6" y1="17" x2="50" y2="17"/><line x1="6" y1="39" x2="50" y2="39"/>
              </svg>
              <h1 style={{ fontFamily:'Libre Baskerville,serif', fontSize:'22px', color:'#1a2744', marginBottom:'8px' }}>{t.loginTitle}</h1>
              <p style={{ fontSize:'13px', color:'#5a6478' }}>{t.loginSub}</p>
            </div>
            <div style={{ marginBottom:'12px' }}>
              <input
                type="password"
                value={pwInput}
                onChange={e => setPwInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && login()}
                placeholder={t.loginPlaceholder}
                style={{ width:'100%', padding:'12px 16px', border:`1.5px solid ${pwError ? '#fca5a5' : '#e4e8ed'}`, borderRadius:'8px', fontSize:'15px', fontFamily:'Source Sans 3,sans-serif', outline:'none', background: pwError ? '#fff5f5' : 'white' }}
              />
              {pwError && <p style={{ color:'#dc2626', fontSize:'12px', marginTop:'6px' }}>{t.loginError}</p>}
            </div>
            <button onClick={login} style={{ width:'100%', padding:'12px', background:'#1a2744', color:'white', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif' }}>
              {t.loginBtn}
            </button>
            <div style={{ textAlign:'center', marginTop:'16px' }}>
              <button onClick={toggleLang} style={{ background:'none', border:'none', color:'#9aa3b0', fontSize:'12px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif' }}>🌐 {t.langBtn}</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // MAIN PLATFORM
  return (
    <>
      <Head>
        <title>{t.loginTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      {showUpload && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
          <div style={{ background:'white', borderRadius:'12px', padding:'28px', maxWidth:'620px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontFamily:'Libre Baskerville,serif', fontSize:'18px', color:'#1a2744', marginBottom:'4px' }}>{t.uploadTitle}</h3>
            <p style={{ fontSize:'13px', color:'#5a6478', marginBottom:'4px' }}>{activeChapter.icon} {activeChapter.number}. {activeChapter.title}</p>
            <p style={{ fontSize:'12px', color:'#9aa3b0', marginBottom:'16px', lineHeight:'1.6' }}>{t.uploadDesc}</p>
            <textarea
              value={uploadText}
              onChange={e => setUploadText(e.target.value)}
              placeholder={t.uploadPlaceholder}
              style={{ width:'100%', height:'260px', padding:'12px', border:'1.5px solid #e4e8ed', borderRadius:'8px', fontSize:'13px', fontFamily:'Source Sans 3,sans-serif', resize:'vertical', outline:'none' }}
            />
            <div style={{ display:'flex', gap:'10px', marginTop:'16px', justifyContent:'flex-end' }}>
              <button onClick={() => setShowUpload(false)} style={{ padding:'9px 20px', background:'#f0f2f5', border:'none', borderRadius:'7px', fontSize:'14px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif' }}>{t.uploadCancel}</button>
              <button onClick={saveUpload} style={{ padding:'9px 20px', background: uploadSaved ? '#16a34a' : '#1a2744', color:'white', border:'none', borderRadius:'7px', fontSize:'14px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', transition:'background 0.3s' }}>
                {uploadSaved ? t.uploadSaved : t.uploadSave}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', height:'100vh', fontFamily:'Source Sans 3,sans-serif', overflow:'hidden' }}>

        {/* SIDEBAR */}
        <div style={{ width:'260px', background:'#1a2744', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'20px 16px', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                <circle cx="20" cy="20" r="18"/><ellipse cx="20" cy="20" rx="8" ry="18"/>
                <line x1="2" y1="20" x2="38" y2="20"/><line x1="5" y1="12" x2="35" y2="12"/><line x1="5" y1="28" x2="35" y2="28"/>
              </svg>
              <div>
                <div style={{ fontFamily:'Libre Baskerville,serif', fontSize:'13px', fontWeight:'700', color:'white', lineHeight:'1.3' }}>Article 6 Platform</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)' }}>Morocco</div>
              </div>
            </div>
          </div>

          <div style={{ padding:'12px 8px', flex:1, overflowY:'auto' }}>
            <div style={{ fontSize:'10px', fontWeight:'600', letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', padding:'0 8px', marginBottom:'8px' }}>Chapters</div>
            {CHAPTERS.map(ch => (
              <button key={ch.id} onClick={() => switchChapter(ch)}
                style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px', borderRadius:'8px', border:'none', background: activeChapter.id === ch.id ? '#0a7ea4' : 'transparent', color: activeChapter.id === ch.id ? 'white' : 'rgba(255,255,255,0.6)', cursor:'pointer', textAlign:'left', fontFamily:'Source Sans 3,sans-serif', fontSize:'13px', marginBottom:'2px', transition:'all 0.15s', lineHeight:'1.4' }}>
                <span style={{ fontSize:'16px', flexShrink:0, marginTop:'1px' }}>{ch.icon}</span>
                <div>
                  <div style={{ fontSize:'10px', opacity:0.7, marginBottom:'2px' }}>Chapter {ch.number}</div>
                  <div style={{ fontWeight: activeChapter.id === ch.id ? '600' : '400' }}>{ch.title}</div>
                  {chapterDocs[ch.id] && <div style={{ fontSize:'10px', color: activeChapter.id === ch.id ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', marginTop:'3px' }}>✓ Documents loaded</div>}
                </div>
              </button>
            ))}
          </div>

          <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={toggleLang} style={{ width:'100%', padding:'7px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'6px', color:'rgba(255,255,255,0.7)', fontSize:'12px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', marginBottom:'8px' }}>🌐 {t.langBtn}</button>
            <button onClick={logout} style={{ width:'100%', padding:'7px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'6px', color:'rgba(255,255,255,0.4)', fontSize:'12px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif' }}>{t.logout}</button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* TOP BAR */}
          <div style={{ background:'white', borderBottom:'1px solid #e4e8ed', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <div style={{ fontFamily:'Libre Baskerville,serif', fontSize:'16px', fontWeight:'700', color:'#1a2744' }}>
                {activeChapter.icon} {activeChapter.number}. {activeChapter.title}
              </div>
              <div style={{ fontSize:'11px', color:'#9aa3b0', marginTop:'2px' }}>
                {currentDoc ? '✅ Documents loaded — chatbot will use your content' : '⚠️ No documents uploaded yet for this chapter'}
              </div>
            </div>
            <button onClick={openUpload} style={{ padding:'8px 16px', background:'#1a2744', color:'white', border:'none', borderRadius:'7px', fontSize:'13px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', fontWeight:'500' }}>
              {t.uploadBtn}
            </button>
          </div>

          {/* CHAT AREA */}
          <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>
            {currentMessages.length === 0 ? (
              <div style={{ maxWidth:'600px', margin:'40px auto 0', textAlign:'center' }}>
                <div style={{ fontSize:'48px', marginBottom:'16px' }}>{activeChapter.icon}</div>
                <h2 style={{ fontFamily:'Libre Baskerville,serif', fontSize:'20px', color:'#1a2744', marginBottom:'10px' }}>{activeChapter.number}. {activeChapter.title}</h2>
                <p style={{ fontSize:'14px', color:'#5a6478', lineHeight:'1.7', marginBottom:'24px' }}>
                  {currentDoc ? `Documents loaded. Ask any question about ${activeChapter.title}.` : t.noDoc}
                </p>
              </div>
            ) : (
              <div style={{ maxWidth:'700px', width:'100%', margin:'0 auto', display:'flex', flexDirection:'column', gap:'20px' }}>
                {currentMessages.map((msg, i) => (
                  <div key={i} style={{ display:'flex', gap:'12px', flexDirection:msg.role==='user'?'row-reverse':'row' }}>
                    {msg.role === 'assistant' && (
                      <div style={{ width:'32px', height:'32px', background:'#1a2744', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, padding:'6px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" style={{ width:'100%', height:'100%' }}>
                          <circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="5" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                        </svg>
                      </div>
                    )}
                    <div style={{ flex:1, maxWidth:'calc(100% - 44px)' }}>
                      <div style={{ padding:'12px 16px', borderRadius:msg.role==='user'?'10px 3px 10px 10px':'3px 10px 10px 10px', background:msg.role==='user'?'#1a2744':msg.isError?'#fff5f5':'white', color:msg.role==='user'?'white':msg.isError?'#991b1b':'#1e2535', border:msg.role==='assistant'?msg.isError?'1px solid #fecaca':'1px solid #e4e8ed':'none', fontSize:'14px', lineHeight:'1.7', whiteSpace:'pre-wrap' }}>
                        {msg.content}
                      </div>
                      {msg.role==='assistant' && msg.sources?.length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'8px', alignItems:'center' }}>
                          <span style={{ fontSize:'11px', fontWeight:'600', textTransform:'uppercase', color:'#9aa3b0' }}>{t.sources}:</span>
                          {msg.sources.map((s,j) => <span key={j} style={{ padding:'3px 9px', background:'#f7f1e3', border:'1px solid #e0cfa0', borderRadius:'4px', fontSize:'11.5px', color:'#7a5c20', fontWeight:'500' }}>{s}</span>)}
                        </div>
                      )}
                      {msg.role==='assistant' && msg.followUpQuestions?.length > 0 && (
                        <div style={{ marginTop:'10px' }}>
                          <span style={{ display:'block', fontSize:'11px', fontWeight:'600', textTransform:'uppercase', color:'#9aa3b0', marginBottom:'7px' }}>{t.followUp}:</span>
                          <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                            {msg.followUpQuestions.map((q,j) => (
                              <button key={j} onClick={() => sendMsg(q)} style={{ padding:'7px 13px', background:'#f8f9fa', border:'1px solid #e4e8ed', borderLeft:'3px solid #0a7ea4', borderRadius:'4px', fontSize:'13px', color:'#1a2744', textAlign:'left', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', lineHeight:'1.4' }}
                                onMouseEnter={e => e.currentTarget.style.background='#e8f4f8'}
                                onMouseLeave={e => e.currentTarget.style.background='#f8f9fa'}>
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display:'flex', gap:'12px' }}>
                    <div style={{ width:'32px', height:'32px', background:'#1a2744', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, padding:'6px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" style={{ width:'100%', height:'100%' }}><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="5" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                    </div>
                    <div style={{ padding:'12px 16px', background:'white', border:'1px solid #e4e8ed', borderRadius:'3px 10px 10px 10px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ display:'flex', gap:'4px' }}>
                        {[0,1,2].map(i => <span key={i} style={{ width:'6px', height:'6px', background:'#0a7ea4', borderRadius:'50%', display:'inline-block', animation:'bounce 1.2s infinite', animationDelay:`${i*0.2}s` }}/>)}
                      </div>
                      <span style={{ fontSize:'13px', color:'#9aa3b0' }}>{t.thinking}</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={{ padding:'12px 24px 20px', background:'white', borderTop:'1px solid #e4e8ed', flexShrink:0 }}>
            <div style={{ maxWidth:'700px', margin:'0 auto', display:'flex', alignItems:'flex-end', gap:'8px', background:'#f8f9fa', border:'1.5px solid #e4e8ed', borderRadius:'10px', padding:'6px 6px 6px 14px' }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={t.placeholder} rows={1} disabled={loading}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:'Source Sans 3,sans-serif', fontSize:'14px', color:'#1e2535', resize:'none', maxHeight:'140px', lineHeight:'1.6', padding:'4px 0' }}/>
              <button onClick={() => sendMsg()} disabled={loading || !input.trim()}
                style={{ width:'36px', height:'36px', background:loading||!input.trim()?'#e4e8ed':'#0a7ea4', border:'none', borderRadius:'7px', color:'white', cursor:loading||!input.trim()?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, padding:'8px' }}>
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:'100%', height:'100%' }}><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </>
  );
}
