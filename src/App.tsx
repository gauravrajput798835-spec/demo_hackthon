import { useEffect, useMemo, useState } from 'react';
import { answerQuestion, findFAQ, type FAQ, type FAQIntent } from './assistantLogic.ts';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  Info,
  Landmark,
  Link2,
  MessageCircle,
  Mic,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  WifiOff,
  X,
} from 'lucide-react';

type Screen = 'welcome' | 'chat';
type AnswerKind = 'verified' | 'unknown';
type Message = { id: number; role: 'user' | 'assistant'; text: string; kind?: AnswerKind; intent?: FAQIntent; question?: string };

const suggestions = [
  { label: 'Which documents are needed for the exam form?', icon: ClipboardList, tone: 'blue' },
  { label: 'How can I check the exam form deadline?', icon: Clock3, tone: 'red' },
  { label: 'What is the admission process for lateral entry?', icon: GraduationCap, tone: 'green' },
  { label: 'Where can I find scholarship information?', icon: Award, tone: 'indigo' },
];

function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [language, setLanguage] = useState<'english' | 'hinglish'>('hinglish');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [helpful, setHelpful] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const latestAnswer = useMemo(() => [...messages].reverse().find((message) => message.role === 'assistant'), [messages]);

  function newChat() {
    setScreen('welcome');
    setMessages([]);
    setQuestion('');
    setError(false);
    setHelpful(null);
  }

  function submitQuestion(value = question) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setScreen('chat');
    setQuestion('');
    setError(false);
    setHelpful(null);
    const userMessage: Message = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    window.setTimeout(() => {
      const answer = answerQuestion(trimmed);
      if (trimmed.toLowerCase().includes('error')) {
        setLoading(false);
        setError(true);
        return;
      }
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: answer.text,
          kind: answer.kind,
          intent: answer.intent,
          question: trimmed,
        },
      ]);
      setLoading(false);
    }, 750);
  }

  function retry() {
    const previousQuestion = [...messages].reverse().find((message) => message.role === 'user')?.text;
    setError(false);
    if (previousQuestion) submitQuestion(previousQuestion);
  }

  return (
    <main className="app-shell">
      {screen === 'welcome' ? (
        <WelcomeScreen
          language={language}
          setLanguage={setLanguage}
          onNewChat={newChat}
          onSuggestion={submitQuestion}
          question={question}
          setQuestion={setQuestion}
          onSubmit={() => submitQuestion()}
          offline={offline}
        />
      ) : (
        <ChatScreen
          language={language}
          setLanguage={setLanguage}
          question={question}
          setQuestion={setQuestion}
          messages={messages}
          loading={loading}
          error={error}
          offline={offline}
          latestAnswer={latestAnswer}
          helpful={helpful}
          setHelpful={setHelpful}
          onBack={newChat}
          onSubmit={(value?: string) => submitQuestion(value)}
          onRetry={retry}
        />
      )}
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <div className="brand-mark"><GraduationCap size={compact ? 17 : 22} strokeWidth={2.2} /></div>
      <div><strong>CampusSathi</strong><span>College Answers, Without the Queue.</span></div>
    </div>
  );
}

function LanguageToggle({ language, setLanguage }: { language: 'english' | 'hinglish'; setLanguage: (value: 'english' | 'hinglish') => void }) {
  return <div className="language-toggle" aria-label="Choose language">
    <button className={language === 'english' ? 'selected' : ''} onClick={() => setLanguage('english')}>EN</button>
    <span>|</span>
    <button className={language === 'hinglish' ? 'selected' : ''} onClick={() => setLanguage('hinglish')}>हिंदी</button>
  </div>;
}

function WelcomeScreen({ language, setLanguage, onNewChat, onSuggestion, question, setQuestion, onSubmit, offline }: {
  language: 'english' | 'hinglish'; setLanguage: (value: 'english' | 'hinglish') => void; onNewChat: () => void;
  onSuggestion: (value: string) => void; question: string; setQuestion: (value: string) => void; onSubmit: () => void; offline: boolean;
}) {
  return <div className="welcome-page">
    <header className="topbar welcome-topbar">
      <Brand />
      <div className="topbar-actions"><LanguageToggle language={language} setLanguage={setLanguage} /><button className="icon-button purple" onClick={onNewChat} aria-label="New chat"><Plus size={25} /></button><button className="icon-button purple" aria-label="Profile"><UserRound size={21} /></button></div>
    </header>
    <div className="welcome-controls"><div className="language-pills"><button className={language === 'english' ? 'active' : ''} onClick={() => setLanguage('english')}>English</button><button className={language === 'hinglish' ? 'active' : ''} onClick={() => setLanguage('hinglish')}>हिंदी / Hinglish</button></div><button className="soft-button" onClick={onNewChat}><Plus size={17} /> New Chat</button></div>
    {offline && <OfflineBanner />}
    <section className="hero-intro">
      <div className="hero-logo"><GraduationCap size={37} /><span /></div>
      <div className="verified-pill"><ShieldCheck size={19} /> University Circular Verified</div>
      <div className="demo-badge">Demo mode · Sample FAQ knowledge base</div>
      <h1>What do you need help<br />with today?</h1>
      <p>College Answers, Without the Queue. Ask in<br className="desktop-only" /> conversational Hindi, English, or mixed slang.</p>
    </section>
    <div className="topic-tabs"><button className="active"><CalendarDays size={18} /> Exams &amp; Forms</button><button><Landmark size={18} /> Fee Deadlines</button><button><GraduationCap size={18} /> Scholarships</button></div>
    <section className="faq-section"><div className="section-heading"><h2><Sparkles size={21} /> Frequently Asked This Week</h2><span>Tap to ask</span></div><div className="faq-list">{suggestions.map(({ label, icon: Icon, tone }) => <button className="faq-card" key={label} onClick={() => onSuggestion(label)}><span className={`faq-icon ${tone}`}><Icon size={23} /></span><span className="faq-copy"><strong>{label}</strong><small><i className={tone} />{tone === 'blue' ? 'BCA & B.Tech 2024' : tone === 'red' ? 'Winter Semester · Closing Soon' : tone === 'green' ? 'Eligibility & Dates' : 'State & National schemes'}</small></span><span className="round-arrow"><ArrowUp size={19} /></span></button>)}</div></section>
    <QuestionComposer question={question} setQuestion={setQuestion} onSubmit={onSubmit} />
    <div className="trust-note"><ShieldCheck size={20} /> Answers are strictly derived from verified college<br className="desktop-only" /> circulars and student FAQs.</div>
    <BottomNav />
  </div>;
}

function OfflineBanner() { return <div className="offline-banner"><WifiOff size={16} /> You’re offline. Cached FAQs are still available.</div>; }

function ChatScreen({ language, setLanguage, question, setQuestion, messages, loading, error, offline, latestAnswer, helpful, setHelpful, onBack, onSubmit, onRetry }: {
  language: 'english' | 'hinglish'; setLanguage: (value: 'english' | 'hinglish') => void; question: string; setQuestion: (value: string) => void;
  messages: Message[]; loading: boolean; error: boolean; offline: boolean; latestAnswer?: Message; helpful: 'yes' | 'no' | null; setHelpful: (value: 'yes' | 'no') => void;
  onBack: () => void; onSubmit: (value?: string) => void; onRetry: () => void;
}) {
  return <div className="chat-page">
    <header className="topbar chat-topbar"><button className="back-button" onClick={onBack} aria-label="Back"><ArrowLeft size={24} /></button><Brand compact /><div className="topbar-actions"><LanguageToggle language={language} setLanguage={setLanguage} /><button className="icon-button purple" aria-label="Profile"><UserRound size={20} /></button></div></header>
    <div className="chat-meta"><span><i /> Active Session</span><b>·</b><strong>Exam Cell Desk</strong><button><BookOpen size={15} /> Save Thread</button></div>
    {offline && <OfflineBanner />}
    <section className="conversation">{messages.map((message) => message.role === 'user' ? <UserMessage key={message.id} message={message} /> : <AssistantMessage key={message.id} message={message} faq={message.kind === 'verified' ? findFAQ(message.question ?? '') : undefined} helpful={helpful} setHelpful={setHelpful} />)}{loading && <LoadingMessage />}{error && <ErrorMessage onRetry={onRetry} />}</section>
    {latestAnswer && !loading && !error && <div className="next-questions"><div><Sparkles size={17} /> Suggested Next Questions:</div><div className="suggestion-scroll">{suggestions.slice(0, 3).map(({ label }) => <button key={label} onClick={() => onSubmit(label)}>{label}<ArrowRight size={14} /></button>)}</div></div>}
    <QuestionComposer question={question} setQuestion={setQuestion} onSubmit={onSubmit} compact />
  </div>;
}

function UserMessage({ message }: { message: Message }) { return <div className="user-message"><span>You · Today, 2:15 PM</span><div>{message.text}</div><small><Check size={14} /><Check size={14} /> Delivered to Campus AI</small></div>; }

function AssistantMessage({ message, faq, helpful, setHelpful }: { message: Message; faq?: FAQ; helpful: 'yes' | 'no' | null; setHelpful: (value: 'yes' | 'no') => void }) {
  if (message.kind === 'unknown') return <div className="assistant-block"><AssistantHeader /><div className="unknown-card"><div className="warning-box"><Info size={19} /><span><strong>INFORMATION NOT VERIFIED</strong><small>No supporting source was found in the verified data</small></span></div><p>{message.text}</p><div className="zero-spoof"><ShieldCheck size={20} /><span><strong>Zero Speculation Promise</strong><small>CampusSathi only provides confirmed updates. If the college has not released a verified source, we do not speculate or reuse unrelated information.</small></span></div><strong className="recommended">RECOMMENDED NEXT STEPS</strong><div className="steps"><span><b>1</b>Check the official college notice board.</span><span><b>2</b>Contact your class representative or department office.</span></div><button className="primary-action"><FileText size={17} /> Check Official Notice Board</button><button className="secondary-action"><RefreshCw size={17} /> Ask Another Question</button><a className="report-link"><Info size={16} /> Report missing circular</a><button className="notify-button"><Bell size={15} /> Notify me when updated</button></div></div>;
  return <div className="assistant-block"><AssistantHeader /><div className="answer-card"><div className="answer-top"><span><ShieldCheck size={16} /> Verified Answer</span><small>BCA / Academic Year 2024–25</small></div><div className="answer-content"><p>{message.text}</p><div className="document-list">{faq?.documents.map((document) => <div className="document-item" key={document}><CheckCircle2 size={24} /><span>{document}</span></div>)}</div><div className="info-note"><Info size={20} /><strong>Important note:</strong><span>{faq?.note}</span></div><SourceCard faq={faq} /><div className="disclaimer">Illustrative guide based on Dean’s Office notice. Please verify with your department exam counter before submission.</div><div className="helpful"><span>Was this helpful?</span><button className={helpful === 'yes' ? 'chosen' : ''} onClick={() => setHelpful('yes')}><ThumbsUp size={18} /></button><button className={helpful === 'no' ? 'chosen' : ''} onClick={() => setHelpful('no')}><ThumbsDown size={18} /></button></div><div className="answer-actions"><button><ClipboardList size={16} /> Copy List</button><button className="whatsapp"><Link2 size={16} /> WhatsApp</button></div></div></div></div>;
}

function AssistantHeader() { return <div className="assistant-header"><span className="bot-avatar"><Bot size={18} /></span><strong>CampusSathi AI</strong><span>· Verified Assistant</span><small>Just now</small></div>; }
function LoadingMessage() { return <div className="assistant-block"><AssistantHeader /><div className="loading-card"><div className="loading-orb"><Sparkles size={23} /></div><strong>Checking verified college sources...</strong><span>CampusSathi is reviewing the latest circulars.</span><div className="skeleton" /><div className="skeleton short" /></div></div>; }
function ErrorMessage({ onRetry }: { onRetry: () => void }) { return <div className="error-card"><X size={22} /><div><strong>We couldn’t reach the college source</strong><span>Your question is safe. Please retry when the connection is available.</span></div><button onClick={onRetry}><RefreshCw size={16} /> Retry</button></div>; }
function SourceCard({ faq }: { faq?: FAQ }) { return <div className="source-card"><div><Landmark size={19} /><strong>Verified Source: {faq?.documents[0] ?? 'College Circular'}</strong></div><span>Updated: 2 days ago</span><button><FileCheck2 size={18} /><strong>{faq?.documents[0] ?? 'Official notice'}</strong><ArrowRight size={16} /></button></div>; }
function QuestionComposer({ question, setQuestion, onSubmit, compact = false }: { question: string; setQuestion: (value: string) => void; onSubmit: () => void; compact?: boolean }) { return <div className={`composer-wrap ${compact ? 'composer-compact' : ''}`}><form className="composer" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><button type="button" className="composer-add" aria-label="Attach file"><Plus size={19} /></button><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={compact ? 'Ask a verified college question...' : 'Ask in Hindi or English... (उदा. exam form)'} aria-label="Ask CampusSathi" /><button type="button" className="mic" aria-label="Voice input"><Mic size={20} /></button><button type="submit" className="send" aria-label="Send question"><ArrowUp size={22} /></button></form></div>; }
function BottomNav() { return <nav className="bottom-nav"><button className="active"><MessageCircle size={22} />Answers</button><button><Search size={22} />Explore</button><button><ShieldCheck size={22} />Notices</button><button><BookOpen size={22} />Activity</button></nav>; }

export default App;
