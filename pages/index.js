import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

const translations = {
  en: {
    title: 'Article 6 Knowledge Platform',
    subtitle: 'Paris Agreement — Carbon Markets & Cooperative Approaches',
    placeholder: 'Ask a question about Article 6...',
    send: 'Send',
    sources: 'Sources',
    followUp: 'Suggested questions',
    thinking: 'Analyzing...',
    langBtn: 'Français',
    docsPlaceholder: 'Paste your Article 6 documents here (optional)...',
    docsLabel: 'Knowledge Base',
    docsBtn: 'Save Documents',
    docsSaved: '✅ Documents saved',
    welcomeTitle: 'Welcome to the Article 6 Capacity Building Platform',
    welcomeDesc: 'Expert guidance on Article 6 of the Paris Agreement — carbon markets, ITMOs, the Sustainable Development Mechanism, and non-market approaches.',
    starters: [
      'What is Article 6.2 and how does it work?',
      'What are ITMOs and how are they transferred?',
      'How does Article 6.4 differ from the CDM?',
      'What are non-market approaches under Article 6.8?',
    ],
  },
  fr: {
    title: 'Plateforme de Connaissances Article 6',
    subtitle: 'Accord de Paris — Marchés Carbone & Approches Coopératives',
    placeholder: "Posez une question sur l'Article 6...",
    send: 'Envoyer',
    sources: 'Sources',
    followUp: 'Questions suggérées',
    thinking: 'Analyse en cours...',
    langBtn: 'English',
    docsPlaceholder: 'Collez vos documents Article 6 ici (optionnel)...',
    docsLabel: 'Base de Connaissances',
    docsBtn: 'Sauvegarder',
    docsSaved: '✅ Documents sauvegardés',
    welcomeTitle: 'Bienvenue sur la Plateforme Article 6',
    welcomeDesc: "Conseils d'experts sur l'Article 6 de l'Accord de Paris — marchés du carbone, EMAT, Mécanisme de Développement Durable.",
    starters: [
      "Qu'est-ce que l'Article 6.2 ?",
      'Que sont les EMAT et comment sont-ils transférés ?',
      "En quoi l'Article 6.4 diffère-t-il du MDP ?",
      "Quelles sont les approches non marchandes de l'Article 6.8 ?",
    ],
  },
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('en');
  const [docsText, setDocsText] = useState('');
  const [docsInput, setDocsInput] = useState('');
  const [docsSaved, setDocsSaved] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const bottomRef = useRef(null);
  const t = translations[lang];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveDocs = () => {
    setDocsText(docsInput);
    setDocsSaved(true);
    setShowDocs(false);
    setTimeout(() => setDocsSaved(false), 3000);
  };

  const sendMsg = async (text) => {
    if (loading) return;
    const txt = text || input;
    if (!txt.trim()) return;
    const userMsg = { role: 'user', content: txt };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          language: lang,
          docsText,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || data.error || 'No response',
        sources: data.sources || [],
        followUpQuestions: data.followUpQuestions || [],
        isError: !!data.error,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.', sources: [], followUpQuestions: [], isError: true }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      {showDocs && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px' }}>
          <div style={{ background:'white',borderRadius:'12px',padding:'28px',maxWidth:'600px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontFamily:'Libre Baskerville,serif',fontSize:'18px',color:'#1a2744',marginBottom:'8px' }}>{t.docsLabel}</h3>
            <p style={{ fontSize:'13px',color:'#5a6478',marginBottom:'16px',lineHeight:'1.6' }}>Paste the text from your Article 6 PDFs or Word documents. Open your document, select all (Ctrl+A), copy (Ctrl+C), paste below.</p>
            <textarea
              value={docsInput}
              onChange={e => setDocsInput(e.target.value)}
              placeholder={t.docsPlaceholder}
              style={{ width:'100%',height:'240px',padding:'12px',border:'1.5px solid #e4e8ed',borderRadius:'8px',fontSize:'13px',fontFamily:'Source Sans 3,sans-serif',resize:'vertical',outline:'none' }}
            />
            <div style={{ display:'flex',gap:'10px',marginTop:'16px',justifyContent:'flex-end' }}>
              <button onClick={() => setShowDocs(false)} style={{ padding:'9px 20px',background:'#f0f2f5',border:'none',borderRadius:'7px',fontSize:'14px',cursor:'pointer',fontFamily:'Source Sans 3,sans-serif' }}>Cancel</button>
              <button onClick={saveDocs} style={{ padding:'9px 20px',background:'#1a2744',color:'white',border:'none',borderRadius:'7px',fontSize:'14px',cursor:'pointer',fontFamily:'Source Sans 3,sans-serif' }}>{t.docsBtn}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex',flexDirection:'column',height:'100vh',background:'#f0f2f5',fontFamily:'Source Sans 3,sans-serif' }}>

        <div style={{ background:'white',borderBottom:'1px solid #e4e8ed',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" stroke="#0a7ea4" strokeWidth="1.5">
              <circle cx="20" cy="20" r="18"/><ellipse cx="20" cy="20" rx="8" ry="18"/>
              <line x1="2" y1="20" x2="38" y2="20"/><line x1="5" y1="12" x2="35" y2="12"/><line x1="5" y1="28" x2="35" y2="28"/>
            </svg>
            <div>
              <div style={{ fontFamily:'Libre Baskerville,serif',fontSize:'16px',fontWeight:'700',color:'#1a2744' }}>{t.title}</div>
              <div style={{ fontSize:'11px',color:'#5a6478' }}>{t.subtitle}</div>
            </div>
          </div>
          <div style={{ display:'flex',gap:'8px',alignItems:'center' }}>
            {docsSaved && <span style={{ fontSize:'12px',color:'#16a34a' }}>{t.docsSaved}</span>}
            <button onClick={() => setShowDocs(true)} style={{ padding:'6px 14px',background:'#f0f2f5',border:'1px solid #e4e8ed',borderRadius:'20px',fontSize:'12px',cursor:'pointer',fontFamily:'Source Sans 3,sans-serif',color:'#5a6478' }}>
              📄 {t.docsLabel}
            </button>
            <button onClick={() => setLang(l => l === 'en' ? 'fr' : 'en')} style={{ padding:'6px 14px',background:'#f0f2f5',border:'1px solid #e4e8ed',borderRadius:'20px',fontSize:'12px',cursor:'pointer',fontFamily:'Source Sans 3,sans-serif',color:'#5a6478' }}>
              🌐 {t.langBtn}
            </button>
          </div>
        </div>

        <div style={{ flex:1,overflowY:'auto',padding:'24px',display:'flex',flexDirection:'column',gap:'20px' }}>
          {messages.length === 0 ? (
            <div style={{ maxWidth:'620px',margin:'30px auto 0',textAlign:'center' }}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="#0a7ea4" strokeWidth="1.5" style={{ margin:'0 auto 20px',display:'block' }}>
                <circle cx="28" cy="28" r="26"/><ellipse cx="28" cy="28" rx="11" ry="26"/>
                <line x1="2" y1="28" x2="54" y2="28"/><line x1="6" y1="17" x2="50" y2="17"/><line x1="6" y1="39" x2="50" y2="39"/>
              </svg>
              <h2 style={{ fontFamily:'Libre Baskerville,serif',fontSize:'22px',color:'#1a2744',marginBottom:'10px' }}>{t.welcomeTitle}</h2>
              <p style={{ fontSize:'14px',color:'#5a6478',lineHeight:'1.7',marginBottom:'28px' }}>{t.welcomeDesc}</p>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px' }}>
                {t.starters.map((q, i) => (
                  <button key={i} onClick={() => sendMsg(q)} style={{ padding:'11px 14px',background:'white',border:'1px solid #e4e8ed',borderRadius:'8px',fontSize:'13px',color:'#1a2744',textAlign:'left',cursor:'pointer',fontFamily:'Source Sans 3,sans-serif',lineHeight:'1.4',transition:'all 0.15s' }}
                    onMouseEnter={e => { e.target.style.borderColor='#0a7ea4'; e.target.style.background='#e8f4f8'; }}
                    onMouseLeave={e => { e.target.style.borderColor='#e4e8ed'; e.target.style.background='white'; }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth:'700px',width:'100%',margin:'0 auto',display:'flex',flexDirection:'column',gap:'20px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display:'flex',gap:'12px',flexDirection:msg.role==='user'?'row-reverse':'row' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width:'32px',height:'32px',background:'#1a2744',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,padding:'6px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" style={{ width:'100%',height:'100%' }}>
                        <circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="5" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ flex:1,maxWidth:'calc(100% - 44px)' }}>
                    <div style={{ padding:'12px 16px',borderRadius:msg.role==='user'?'10px 3px 10px 10px':'3px 10px 10px 10px',background:msg.role==='user'?'#1a2744':msg.isError?'#fff5f5':'white',color:msg.role==='user'?'white':msg.isError?'#991b1b':'#1e2535',border:msg.role==='assistant'?msg.isError?'1px solid #fecaca':'1px solid #e4e8ed':'none',fontSize:'14px',lineHeight:'1.7',whiteSpace:'pre-wrap' }}>
                      {msg.content}
                    </div>
                    {msg.role==='assistant' && msg.sources?.length > 0 && (
                      <div style={{ display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'8px',alignItems:'center' }}>
                        <span style={{ fontSize:'11px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.05em',color:'#9aa3b0' }}>{t.sources}:</span>
                        {msg.sources.map((s,j) => <span key={j} style={{ padding:'3px 9px',background:'#f7f1e3',border:'1px solid #e0cfa0',borderRadius:'4px',fontSize:'11.5px',color:'#7a5c20',fontWeight:'500' }}>{s}</span>)}
                      </div>
                    )}
                    {msg.role==='assistant' && msg.followUpQuestions?.length > 0 && (
                      <div style={{ marginTop:'10px' }}>
                        <span style={{ display:'block',fontSize:'11px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.05em',color:'#9aa3b0',marginBottom:'7px' }}>{t.followUp}:</span>
                        <div style={{ display:'flex',flexDirection:'column',gap:'5px' }}>
                          {msg.followUpQuestions.map((q,j) => (
                            <button key={j} onClick={() => sendMsg(q)} style={{ padding:'7px 13px',background:'#f8f9fa',border:'1px solid #e4e8ed',borderLeft:'3px solid #0a7ea4',borderRadius:'4px',fontSize:'13px',color:'#1a2744',textAlign:'left',cursor:'pointer',fontFamily:'Source Sans 3,sans-serif',lineHeight:'1.4' }}
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
                <div style={{ display:'flex',gap:'12px' }}>
                  <div style={{ width:'32px',height:'32px',background:'#1a2744',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,padding:'6px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" style={{ width:'100%',height:'100%' }}><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="5" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                  </div>
                  <div style={{ padding:'12px 16px',background:'white',border:'1px solid #e4e8ed',borderRadius:'3px 10px 10px 10px',display:'flex',alignItems:'center',gap:'10px' }}>
                    <div style={{ display:'flex',gap:'4px' }}>
                      {[0,1,2].map(i => <span key={i} style={{ width:'6px',height:'6px',background:'#0a7ea4',borderRadius:'50%',display:'inline-block',animation:'bounce 1.2s infinite',animationDelay:`${i*0.2}s` }}/>)}
                    </div>
                    <span style={{ fontSize:'13px',color:'#9aa3b0' }}>{t.thinking}</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>
          )}
        </div>

        <div style={{ padding:'12px 24px 20px',background:'white',borderTop:'1px solid #e4e8ed',flexShrink:0 }}>
          <div style={{ maxWidth:'700px',margin:'0 auto',display:'flex',alignItems:'flex-end',gap:'8px',background:'#f8f9fa',border:'1.5px solid #e4e8ed',borderRadius:'10px',padding:'6px 6px 6px 14px' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={t.placeholder} rows={1} disabled={loading}
              style={{ flex:1,background:'transparent',border:'none',outline:'none',fontFamily:'Source Sans 3,sans-serif',fontSize:'14px',color:'#1e2535',resize:'none',maxHeight:'140px',lineHeight:'1.6',padding:'4px 0' }}/>
            <button onClick={() => sendMsg()} disabled={loading || !input.trim()}
              style={{ width:'36px',height:'36px',background:loading||!input.trim()?'#e4e8ed':'#0a7ea4',border:'none',borderRadius:'7px',color:'white',cursor:loading||!input.trim()?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,padding:'8px',transition:'all 0.15s' }}>
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:'100%',height:'100%' }}><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </>
  );
}
