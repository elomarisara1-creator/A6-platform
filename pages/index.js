import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

const CHAPTERS = [
  { id: 'ch1', number: '1', title: 'Article 6 Framework Morocco', icon: '📋' },
  { id: 'ch2', number: '2', title: 'Fee Structure', icon: '💰' },
  { id: 'ch3', number: '3', title: 'Corresponding Adjustment', icon: '⚖️' },
  { id: 'ch4', number: '4', title: 'Overselling Risk Strategy', icon: '📊' },
  { id: 'ch5', number: '5', title: 'Climate Change Law Morocco', icon: '🌍' },
  { id: 'ch6', number: '6', title: 'General Knowledge', icon: '📚' },
];

const T = {
  en: {
    adminLogin: 'Admin Login', userLogin: 'Student Login',
    platformTitle: 'Article 6 Knowledge Platform',
    platformSub: 'Paris Agreement — Morocco Carbon Markets',
    passwordPlaceholder: 'Enter password', enterBtn: 'Enter',
    wrongPassword: 'Incorrect password. Please try again.',
    chapters: 'Chapters', quiz: 'Knowledge Quiz',
    logout: 'Logout', langBtn: 'Français',
    askPlaceholder: 'Ask a question about this chapter...',
    thinking: 'Analyzing documents...', sources: 'Sources',
    followUp: 'Suggested questions', noDocs: 'No documents uploaded yet for this chapter.',
    quizTitle: 'Knowledge Quiz', selectChapter: 'Select a chapter to generate a quiz:',
    generateQuiz: 'Generate Quiz', generating: 'Generating questions...',
    score: 'Your Score', retake: 'Retake Quiz', newQuiz: 'New Chapter',
    correct: '✅ Correct!', incorrect: '❌ Incorrect',
    explanation: 'Explanation', submitQuiz: 'Submit Answers',
    welcomeTitle: 'Welcome to the Article 6 Capacity Building Platform',
    welcomeDesc: 'Select a chapter from the sidebar to start learning.',
    adminBadge: 'Admin', studentBadge: 'Student',
  },
  fr: {
    adminLogin: 'Connexion Admin', userLogin: 'Connexion Étudiant',
    platformTitle: 'Plateforme de Connaissances Article 6',
    platformSub: 'Accord de Paris — Marchés Carbone Maroc',
    passwordPlaceholder: 'Entrez le mot de passe', enterBtn: 'Accéder',
    wrongPassword: 'Mot de passe incorrect. Veuillez réessayer.',
    chapters: 'Chapitres', quiz: 'Quiz de Connaissances',
    logout: 'Déconnexion', langBtn: 'English',
    askPlaceholder: 'Posez une question sur ce chapitre...',
    thinking: 'Analyse en cours...', sources: 'Sources',
    followUp: 'Questions suggérées', noDocs: 'Aucun document téléchargé pour ce chapitre.',
    quizTitle: 'Quiz de Connaissances', selectChapter: 'Sélectionnez un chapitre pour générer un quiz :',
    generateQuiz: 'Générer le Quiz', generating: 'Génération des questions...',
    score: 'Votre Score', retake: 'Recommencer', newQuiz: 'Nouveau Chapitre',
    correct: '✅ Correct !', incorrect: '❌ Incorrect',
    explanation: 'Explication', submitQuiz: 'Soumettre',
    welcomeTitle: 'Bienvenue sur la Plateforme Article 6',
    welcomeDesc: 'Sélectionnez un chapitre dans la barre latérale pour commencer.',
    adminBadge: 'Admin', studentBadge: 'Étudiant',
  },
};

const navy='#1a2744',teal='#0a7ea4',gold='#c9a84c',gray50='#f8f9fa',gray100='#f0f2f5',gray200='#e4e8ed',gray400='#9aa3b0',gray600='#5a6478',text='#1e2535';

export default function Home() {
  const [role, setRole] = useState(null); // null | 'admin' | 'user'
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [loginType, setLoginType] = useState('user');
  const [lang, setLang] = useState('en');
  const [view, setView] = useState('chat'); // 'chat' | 'quiz'
  const [activeChapter, setActiveChapter] = useState(CHAPTERS[0]);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Quiz state
  const [quizChapter, setQuizChapter] = useState(CHAPTERS[0]);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const bottomRef = useRef(null);
  const t = T[lang];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const login = () => {
    setPwError(false);
    const adminPw = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    const userPw = process.env.NEXT_PUBLIC_USER_PASSWORD;
    if (loginType === 'admin' && pwInput === (adminPw || 'admin123')) {
      setRole('admin'); setPwInput('');
    } else if (loginType === 'user' && pwInput === (userPw || 'student123')) {
      setRole('user'); setPwInput('');
    } else {
      setPwError(true);
    }
  };

  const logout = () => { setRole(null); setPwInput(''); setMessages({}); };
  const toggleLang = () => setLang(l => l === 'en' ? 'fr' : 'en');

  const sendMsg = async (text) => {
    if (loading) return;
    const txt = text || input;
    if (!txt.trim()) return;
    const chId = activeChapter.id;
    const newMsgs = [...(messages[chId] || []), { role: 'user', content: txt }];
    setMessages(prev => ({ ...prev, [chId]: newMsgs }));
    setInput(''); setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role, content: m.content })), language: lang, chapterId: chId, chapterName: activeChapter.title }),
      });
      const data = await res.json();
      setMessages(prev => ({ ...prev, [chId]: [...(prev[chId] || []), {
        role: 'assistant', content: data.answer || data.error || 'No response',
        sources: data.sources || [], followUpQuestions: data.followUpQuestions || [], isError: !!data.error,
      }]}));
    } catch {
      setMessages(prev => ({ ...prev, [chId]: [...(prev[chId] || []), { role: 'assistant', content: 'Connection error.', sources: [], followUpQuestions: [], isError: true }]}));
    }
    setLoading(false);
  };

  const generateQuiz = async () => {
    setQuizLoading(true); setQuiz(null); setAnswers({}); setSubmitted(false);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: quizChapter.id, language: lang }),
      });
      const data = await res.json();
      setQuiz(data.questions || []);
    } catch { setQuiz([]); }
    setQuizLoading(false);
  };

  const submitQuiz = () => {
    let s = 0;
    quiz.forEach((q, i) => { if (answers[i] === q.correct) s++; });
    setScore(s); setSubmitted(true);
  };

  const currentMessages = messages[activeChapter.id] || [];

  const sidebarBtn = (label, icon, isActive, onClick) => (
    <button onClick={onClick} style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', border:'none', background: isActive ? teal : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.6)', cursor:'pointer', textAlign:'left', fontFamily:'Source Sans 3,sans-serif', fontSize:'13px', marginBottom:'2px', transition:'all 0.15s' }}>
      <span style={{ fontSize:'16px', flexShrink:0 }}>{icon}</span>
      <span style={{ fontWeight: isActive ? '600' : '400', lineHeight:'1.3' }}>{label}</span>
    </button>
  );

  // LOGIN SCREEN
  if (!role) return (
    <>
      <Head>
        <title>{t.platformTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight:'100vh', background:navy, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'Source Sans 3,sans-serif' }}>
        <div style={{ background:'white', borderRadius:'16px', padding:'40px', maxWidth:'420px', width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <svg width="52" height="52" viewBox="0 0 56 56" fill="none" stroke={teal} strokeWidth="1.5" style={{ margin:'0 auto 14px', display:'block' }}>
              <circle cx="28" cy="28" r="26"/><ellipse cx="28" cy="28" rx="11" ry="26"/>
              <line x1="2" y1="28" x2="54" y2="28"/><line x1="6" y1="17" x2="50" y2="17"/><line x1="6" y1="39" x2="50" y2="39"/>
            </svg>
            <h1 style={{ fontFamily:'Libre Baskerville,serif', fontSize:'20px', color:navy, marginBottom:'6px' }}>{t.platformTitle}</h1>
            <p style={{ fontSize:'12px', color:gray600 }}>{t.platformSub}</p>
          </div>

          <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
            {['user','admin'].map(type => (
              <button key={type} onClick={() => { setLoginType(type); setPwError(false); }}
                style={{ flex:1, padding:'9px', borderRadius:'7px', border:`1.5px solid ${loginType===type ? navy : gray200}`, background: loginType===type ? navy : 'white', color: loginType===type ? 'white' : gray600, fontSize:'13px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', fontWeight:'500', transition:'all 0.15s' }}>
                {type === 'admin' ? `🔑 ${t.adminLogin}` : `👤 ${t.userLogin}`}
              </button>
            ))}
          </div>

          <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)} onKeyDown={e => e.key==='Enter' && login()}
            placeholder={t.passwordPlaceholder}
            style={{ width:'100%', padding:'12px 16px', border:`1.5px solid ${pwError ? '#fca5a5' : gray200}`, borderRadius:'8px', fontSize:'14px', fontFamily:'Source Sans 3,sans-serif', outline:'none', background: pwError ? '#fff5f5' : 'white', marginBottom:'8px' }}/>
          {pwError && <p style={{ color:'#dc2626', fontSize:'12px', marginBottom:'8px' }}>{t.wrongPassword}</p>}
          <button onClick={login} style={{ width:'100%', padding:'12px', background:navy, color:'white', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', marginBottom:'16px' }}>{t.enterBtn}</button>
          <div style={{ textAlign:'center' }}>
            <button onClick={toggleLang} style={{ background:'none', border:'none', color:gray400, fontSize:'12px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif' }}>🌐 {t.langBtn}</button>
          </div>
        </div>
      </div>
    </>
  );

  // MAIN PLATFORM
  return (
    <>
      <Head>
        <title>{t.platformTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ display:'flex', height:'100vh', fontFamily:'Source Sans 3,sans-serif', overflow:'hidden' }}>

        {/* SIDEBAR */}
        <div style={{ width:'260px', background:navy, display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" stroke={gold} strokeWidth="1.5">
                <circle cx="20" cy="20" r="18"/><ellipse cx="20" cy="20" rx="8" ry="18"/>
                <line x1="2" y1="20" x2="38" y2="20"/><line x1="5" y1="12" x2="35" y2="12"/><line x1="5" y1="28" x2="35" y2="28"/>
              </svg>
              <div>
                <div style={{ fontFamily:'Libre Baskerville,serif', fontSize:'13px', fontWeight:'700', color:'white', lineHeight:'1.2' }}>Article 6 Platform</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>
                  <span style={{ background: role==='admin' ? gold : teal, color: role==='admin' ? navy : 'white', padding:'1px 7px', borderRadius:'10px', fontSize:'10px', fontWeight:'600' }}>
                    {role==='admin' ? t.adminBadge : t.studentBadge}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
            <div style={{ fontSize:'10px', fontWeight:'600', letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', padding:'0 8px', marginBottom:'8px' }}>{t.chapters}</div>
            {CHAPTERS.map(ch => (
              <button key={ch.id} onClick={() => { setActiveChapter(ch); setView('chat'); setInput(''); }}
                style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px', borderRadius:'8px', border:'none', background: view==='chat' && activeChapter.id===ch.id ? teal : 'transparent', color: view==='chat' && activeChapter.id===ch.id ? 'white' : 'rgba(255,255,255,0.6)', cursor:'pointer', textAlign:'left', fontFamily:'Source Sans 3,sans-serif', fontSize:'13px', marginBottom:'2px', transition:'all 0.15s' }}>
                <span style={{ fontSize:'15px', flexShrink:0, marginTop:'1px' }}>{ch.icon}</span>
                <div>
                  <div style={{ fontSize:'10px', opacity:0.6, marginBottom:'1px' }}>Ch. {ch.number}</div>
                  <div style={{ fontWeight: view==='chat' && activeChapter.id===ch.id ? '600' : '400', lineHeight:'1.3' }}>{ch.title}</div>
                </div>
              </button>
            ))}

            <div style={{ fontSize:'10px', fontWeight:'600', letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', padding:'0 8px', margin:'16px 0 8px' }}>Assessment</div>
            {sidebarBtn(t.quiz, '🎯', view==='quiz', () => setView('quiz'))}
          </div>

          <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', flexDirection:'column', gap:'6px' }}>
            <button onClick={toggleLang} style={{ padding:'7px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'6px', color:'rgba(255,255,255,0.7)', fontSize:'12px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif' }}>🌐 {t.langBtn}</button>
            <button onClick={logout} style={{ padding:'7px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'6px', color:'rgba(255,255,255,0.4)', fontSize:'12px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif' }}>{t.logout}</button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:gray50 }}>

          {/* TOP BAR */}
          <div style={{ background:'white', borderBottom:`1px solid ${gray200}`, padding:'12px 24px', flexShrink:0 }}>
            {view === 'chat' ? (
              <div>
                <div style={{ fontFamily:'Libre Baskerville,serif', fontSize:'16px', fontWeight:'700', color:navy }}>{activeChapter.icon} {activeChapter.number}. {activeChapter.title}</div>
                <div style={{ fontSize:'11px', color:gray400, marginTop:'2px' }}>
                  {role === 'admin' ? '🔑 Admin mode — documents loaded from Google Drive' : '📖 Ask any question about this chapter'}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily:'Libre Baskerville,serif', fontSize:'16px', fontWeight:'700', color:navy }}>🎯 {t.quizTitle}</div>
                <div style={{ fontSize:'11px', color:gray400, marginTop:'2px' }}>Test your Article 6 knowledge</div>
              </div>
            )}
          </div>

          {/* CHAT VIEW */}
          {view === 'chat' && (
            <>
              <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>
                {currentMessages.length === 0 ? (
                  <div style={{ maxWidth:'600px', margin:'40px auto 0', textAlign:'center' }}>
                    <div style={{ fontSize:'52px', marginBottom:'16px' }}>{activeChapter.icon}</div>
                    <h2 style={{ fontFamily:'Libre Baskerville,serif', fontSize:'20px', color:navy, marginBottom:'10px' }}>{activeChapter.title}</h2>
                    <p style={{ fontSize:'14px', color:gray600, lineHeight:'1.7' }}>{t.welcomeDesc}</p>
                    {role === 'admin' && (
                      <div style={{ marginTop:'20px', padding:'14px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', fontSize:'13px', color:'#15803d' }}>
                        🔑 Admin: Documents are loaded automatically from Google Drive. Upload files to the chapter folder in Drive to update the knowledge base.
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ maxWidth:'700px', width:'100%', margin:'0 auto', display:'flex', flexDirection:'column', gap:'20px' }}>
                    {currentMessages.map((msg, i) => (
                      <div key={i} style={{ display:'flex', gap:'12px', flexDirection:msg.role==='user'?'row-reverse':'row' }}>
                        {msg.role==='assistant' && (
                          <div style={{ width:'32px', height:'32px', background:navy, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, padding:'6px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.5" style={{ width:'100%', height:'100%' }}>
                              <circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="5" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                            </svg>
                          </div>
                        )}
                        <div style={{ flex:1, maxWidth:'calc(100% - 44px)' }}>
                          <div style={{ padding:'12px 16px', borderRadius:msg.role==='user'?'10px 3px 10px 10px':'3px 10px 10px 10px', background:msg.role==='user'?navy:msg.isError?'#fff5f5':'white', color:msg.role==='user'?'white':msg.isError?'#991b1b':text, border:msg.role==='assistant'?msg.isError?'1px solid #fecaca':`1px solid ${gray200}`:'none', fontSize:'14px', lineHeight:'1.7', whiteSpace:'pre-wrap' }}>
                            {msg.content}
                          </div>
                          {msg.role==='assistant' && msg.sources?.length > 0 && (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'8px', alignItems:'center' }}>
                              <span style={{ fontSize:'11px', fontWeight:'600', textTransform:'uppercase', color:gray400 }}>{t.sources}:</span>
                              {msg.sources.map((s,j) => <span key={j} style={{ padding:'3px 9px', background:'#f7f1e3', border:'1px solid #e0cfa0', borderRadius:'4px', fontSize:'11.5px', color:'#7a5c20', fontWeight:'500' }}>{s}</span>)}
                            </div>
                          )}
                          {msg.role==='assistant' && msg.followUpQuestions?.length > 0 && (
                            <div style={{ marginTop:'10px' }}>
                              <span style={{ display:'block', fontSize:'11px', fontWeight:'600', textTransform:'uppercase', color:gray400, marginBottom:'7px' }}>{t.followUp}:</span>
                              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                                {msg.followUpQuestions.map((q,j) => (
                                  <button key={j} onClick={() => sendMsg(q)} style={{ padding:'7px 13px', background:gray50, border:`1px solid ${gray200}`, borderLeft:`3px solid ${teal}`, borderRadius:'4px', fontSize:'13px', color:navy, textAlign:'left', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', lineHeight:'1.4' }}
                                    onMouseEnter={e => e.currentTarget.style.background='#e8f4f8'}
                                    onMouseLeave={e => e.currentTarget.style.background=gray50}>
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
                        <div style={{ width:'32px', height:'32px', background:navy, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, padding:'6px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.5" style={{ width:'100%', height:'100%' }}><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="5" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                        </div>
                        <div style={{ padding:'12px 16px', background:'white', border:`1px solid ${gray200}`, borderRadius:'3px 10px 10px 10px', display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ display:'flex', gap:'4px' }}>
                            {[0,1,2].map(i => <span key={i} style={{ width:'6px', height:'6px', background:teal, borderRadius:'50%', display:'inline-block', animation:'bounce 1.2s infinite', animationDelay:`${i*0.2}s` }}/>)}
                          </div>
                          <span style={{ fontSize:'13px', color:gray400 }}>{t.thinking}</span>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef}/>
                  </div>
                )}
              </div>
              <div style={{ padding:'12px 24px 20px', background:'white', borderTop:`1px solid ${gray200}`, flexShrink:0 }}>
                <div style={{ maxWidth:'700px', margin:'0 auto', display:'flex', alignItems:'flex-end', gap:'8px', background:gray50, border:`1.5px solid ${gray200}`, borderRadius:'10px', padding:'6px 6px 6px 14px' }}>
                  <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}} placeholder={t.askPlaceholder} rows={1} disabled={loading}
                    style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:'Source Sans 3,sans-serif', fontSize:'14px', color:text, resize:'none', maxHeight:'140px', lineHeight:'1.6', padding:'4px 0' }}/>
                  <button onClick={() => sendMsg()} disabled={loading||!input.trim()}
                    style={{ width:'36px', height:'36px', background:loading||!input.trim()?gray200:teal, border:'none', borderRadius:'7px', color:'white', cursor:loading||!input.trim()?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, padding:'8px' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:'100%', height:'100%' }}><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* QUIZ VIEW */}
          {view === 'quiz' && (
            <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>
              <div style={{ maxWidth:'700px', margin:'0 auto' }}>
                {!quiz && !quizLoading && (
                  <div style={{ background:'white', borderRadius:'12px', padding:'28px', border:`1px solid ${gray200}` }}>
                    <h2 style={{ fontFamily:'Libre Baskerville,serif', fontSize:'20px', color:navy, marginBottom:'8px' }}>🎯 {t.quizTitle}</h2>
                    <p style={{ fontSize:'14px', color:gray600, marginBottom:'24px' }}>{t.selectChapter}</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'24px' }}>
                      {CHAPTERS.map(ch => (
                        <button key={ch.id} onClick={() => setQuizChapter(ch)}
                          style={{ padding:'12px 16px', border:`1.5px solid ${quizChapter.id===ch.id ? teal : gray200}`, borderRadius:'8px', background: quizChapter.id===ch.id ? '#e8f4f8' : 'white', color: quizChapter.id===ch.id ? teal : text, textAlign:'left', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', fontSize:'14px', fontWeight: quizChapter.id===ch.id ? '600' : '400', display:'flex', alignItems:'center', gap:'10px' }}>
                          <span>{ch.icon}</span> {ch.number}. {ch.title}
                        </button>
                      ))}
                    </div>
                    <button onClick={generateQuiz} style={{ width:'100%', padding:'12px', background:navy, color:'white', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif' }}>
                      {t.generateQuiz}
                    </button>
                  </div>
                )}

                {quizLoading && (
                  <div style={{ textAlign:'center', padding:'60px', background:'white', borderRadius:'12px', border:`1px solid ${gray200}` }}>
                    <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginBottom:'16px' }}>
                      {[0,1,2].map(i => <span key={i} style={{ width:'10px', height:'10px', background:teal, borderRadius:'50%', display:'inline-block', animation:'bounce 1.2s infinite', animationDelay:`${i*0.2}s` }}/>)}
                    </div>
                    <p style={{ color:gray600, fontSize:'14px' }}>{t.generating}</p>
                  </div>
                )}

                {quiz && !quizLoading && (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
                      <h2 style={{ fontFamily:'Libre Baskerville,serif', fontSize:'18px', color:navy }}>{quizChapter.icon} {quizChapter.title}</h2>
                      {submitted && (
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button onClick={() => { setQuiz(null); setAnswers({}); setSubmitted(false); }} style={{ padding:'7px 14px', background:gray100, border:`1px solid ${gray200}`, borderRadius:'7px', fontSize:'13px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', color:gray600 }}>{t.newQuiz}</button>
                          <button onClick={() => { setAnswers({}); setSubmitted(false); generateQuiz(); }} style={{ padding:'7px 14px', background:navy, color:'white', border:'none', borderRadius:'7px', fontSize:'13px', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif' }}>{t.retake}</button>
                        </div>
                      )}
                    </div>

                    {submitted && (
                      <div style={{ background: score >= 4 ? '#f0fdf4' : score >= 3 ? '#fefce8' : '#fff5f5', border:`1px solid ${score >= 4 ? '#86efac' : score >= 3 ? '#fde047' : '#fca5a5'}`, borderRadius:'10px', padding:'20px', marginBottom:'24px', textAlign:'center' }}>
                        <div style={{ fontSize:'36px', marginBottom:'8px' }}>{score >= 4 ? '🏆' : score >= 3 ? '👍' : '📚'}</div>
                        <div style={{ fontFamily:'Libre Baskerville,serif', fontSize:'22px', color:navy, marginBottom:'4px' }}>{t.score}: {score}/{quiz.length}</div>
                        <div style={{ fontSize:'14px', color:gray600 }}>{score >= 4 ? 'Excellent work!' : score >= 3 ? 'Good effort!' : 'Keep studying!'}</div>
                      </div>
                    )}

                    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                      {quiz.map((q, qi) => (
                        <div key={qi} style={{ background:'white', borderRadius:'10px', padding:'20px', border:`1px solid ${submitted ? (answers[qi]===q.correct ? '#86efac' : '#fca5a5') : gray200}` }}>
                          <p style={{ fontSize:'15px', fontWeight:'600', color:navy, marginBottom:'14px', lineHeight:'1.5' }}>{qi+1}. {q.question}</p>
                          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                            {q.options.map((opt, oi) => {
                              let bg = 'white', border = `1px solid ${gray200}`, color = text;
                              if (submitted) {
                                if (oi === q.correct) { bg='#f0fdf4'; border='1.5px solid #86efac'; color='#15803d'; }
                                else if (answers[qi]===oi) { bg='#fff5f5'; border='1.5px solid #fca5a5'; color='#dc2626'; }
                              } else if (answers[qi]===oi) { bg='#e8f4f8'; border=`1.5px solid ${teal}`; color=teal; }
                              return (
                                <button key={oi} onClick={() => !submitted && setAnswers(prev => ({...prev,[qi]:oi}))}
                                  style={{ padding:'10px 14px', borderRadius:'7px', border, background:bg, color, textAlign:'left', cursor:submitted?'default':'pointer', fontFamily:'Source Sans 3,sans-serif', fontSize:'14px', lineHeight:'1.4', transition:'all 0.15s' }}>
                                  <span style={{ fontWeight:'600', marginRight:'8px' }}>{['A','B','C','D'][oi]}.</span>{opt}
                                </button>
                              );
                            })}
                          </div>
                          {submitted && (
                            <div style={{ marginTop:'12px', padding:'10px 14px', background:'#f8f9fa', borderRadius:'7px', fontSize:'13px', color:gray600, lineHeight:'1.6' }}>
                              <span style={{ fontWeight:'600', color: answers[qi]===q.correct ? '#15803d' : '#dc2626' }}>{answers[qi]===q.correct ? t.correct : t.incorrect}</span>
                              {' '}<span style={{ fontWeight:'600' }}>{t.explanation}:</span> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {!submitted && quiz.length > 0 && (
                      <button onClick={submitQuiz} disabled={Object.keys(answers).length < quiz.length}
                        style={{ width:'100%', padding:'13px', background: Object.keys(answers).length < quiz.length ? gray200 : navy, color:'white', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor: Object.keys(answers).length < quiz.length ? 'not-allowed' : 'pointer', fontFamily:'Source Sans 3,sans-serif', marginTop:'20px' }}>
                        {t.submitQuiz} ({Object.keys(answers).length}/{quiz.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </>
  );
}
