import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { decrypt, parseFragment } from '../shared/crypto.mjs';
import friends from './data/friends.json';

type Assignment = { sender: string; recipient: string; photo: string | null };
type Stage = 'loading' | 'invitation' | 'ready' | 'opening' | 'revealed' | 'error';

function FriendsBanner({ opening }: { opening: boolean }) {
  const [paused, setPaused] = useState(false);
  return <section className={`friends-banner ${paused || opening ? 'is-paused' : ''}`} aria-labelledby="friends-heading">
    <div className="friends-heading"><div><span className="friends-kicker">우리 동기들</span><h2 id="friends-heading">이 중에 내 선물 상대는?</h2></div>
      <button className="banner-toggle" onClick={() => setPaused(value => !value)} aria-pressed={paused} disabled={opening}>{paused ? '▶ 사진 움직이기' : 'Ⅱ 사진 멈추기'}</button>
    </div>
    <div className="friends-window" tabIndex={0} role="group" aria-label="동기 사진 배너. 마우스를 올리거나 키보드로 선택하면 움직임이 멈춥니다.">
      <div className="friends-track">
        {[0, 1].map(copy => <div className="friends-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
          {friends.map((friend, index) => <figure className="friend-photo" key={friend.name} style={{ '--tilt': `${[ -4, 3, -2, 4, -3 ][index % 5]}deg` } as CSSProperties}>
            <img src={friend.src} alt={copy === 0 ? `${friend.name}님` : ''} width="110" height="110" decoding="async" />
            <figcaption>{friend.name}</figcaption>
          </figure>)}
        </div>)}
      </div>
    </div>
    <p className="friends-caption">이번 선물 교환에 함께하지 못하는 동기들의 사진도 담았어요.</p>
  </section>;
}

function Sparkle({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 1c1.6 8 2.8 9.4 11 11-8.2 1.6-9.4 3-11 11C10.4 15 9.2 13.6 1 12 9.2 10.4 10.4 9 12 1Z" fill="currentColor" /></svg>;
}

function Gift({ opening }: { opening: boolean }) {
  return <div className={`gift-scene ${opening ? 'is-opening' : ''}`} aria-hidden="true">
    <div className="gift-halo" />
    <div className="gift-rays" />
    <Sparkle className="gift-spark spark-one" /><Sparkle className="gift-spark spark-two" />
    <span className="little-dot dot-one" /><span className="little-dot dot-two" />
    <svg className="gift" viewBox="0 0 400 370" fill="none">
      <defs>
        <linearGradient id="boxFront" x1="92" y1="190" x2="290" y2="350" gradientUnits="userSpaceOnUse"><stop stopColor="#e24a62" /><stop offset="1" stopColor="#b92340" /></linearGradient>
        <linearGradient id="lidFront" x1="75" y1="155" x2="290" y2="230" gradientUnits="userSpaceOnUse"><stop stopColor="#f7677c" /><stop offset="1" stopColor="#ce324e" /></linearGradient>
        <linearGradient id="ribbon" x1="170" y1="100" x2="230" y2="320" gradientUnits="userSpaceOnUse"><stop stopColor="#ffe9d6" /><stop offset=".55" stopColor="#f8d5b5" /><stop offset="1" stopColor="#e5b78e" /></linearGradient>
        <linearGradient id="bow" x1="128" y1="74" x2="256" y2="163" gradientUnits="userSpaceOnUse"><stop stopColor="#fff1df" /><stop offset="1" stopColor="#edbf98" /></linearGradient>
      </defs>
      <ellipse className="gift-shadow" cx="204" cy="329" rx="114" ry="16" fill="#9c2a42" opacity=".12" />
      <g className="gift-body">
        <path d="m94 191 137 34 81-45v113l-81 43-137-37Z" fill="url(#boxFront)" />
        <path d="m231 225 81-45v113l-81 43Z" fill="#a81e39" />
        <path d="m155 206 39 10v110l-39-11Z" fill="url(#ribbon)" />
        <path d="m264 207 21-12v112l-21 11Z" fill="#e4b38d" />
        <path d="m94 191 137 34 81-45-138-32Z" fill="#78192e" />
        <path d="m103 193 128 32 72-40-129-29Z" fill="#9e2941" />
      </g>
      <g className="gift-lid">
        <path d="m83 168 85-45 156 38-87 48Z" fill="#f57487" />
        <path d="m83 168 154 41v29L83 197Z" fill="url(#lidFront)" />
        <path d="m237 209 87-48v29l-87 48Z" fill="#bb2945" />
        <path d="m147 185 86-46 39 10-87 46v29l-38-10Z" fill="url(#ribbon)" />
        <path d="m129 143 152 42 23-13-154-40Z" fill="#ffe0c3" />
        <path d="m281 185 23-13v29l-23 13Z" fill="#e6b68f" />
        <path d="M203 157c-19-4-74-9-79-40-4-24 17-35 35-19 19 16 31 40 44 59Z" fill="url(#bow)" />
        <path d="M194 148c-17-5-54-18-54-32 0-11 12-8 22 1 11 9 22 20 32 31Z" fill="#cb916d" />
        <path d="M203 156c5-25 11-63 34-73 26-11 40 15 24 37-14 20-37 29-58 36Z" fill="url(#bow)" />
        <path d="M213 146c9-20 18-43 30-48 10-4 14 7 5 18-10 12-23 22-35 30Z" fill="#cf9772" />
        <path d="M199 148c-12 12-29 24-45 29l21 5 3 15c19-15 27-30 31-43Z" fill="#ffe4c8" />
        <path d="M209 149c7 18 18 34 33 47l2-17 19-1c-19-10-32-19-43-32Z" fill="#f1c7a3" />
        <path d="M194 144c4-5 16-7 22-3 7 5 7 16 1 19-6 3-17 0-22-4-3-3-3-9-1-12Z" fill="#ffe8d1" />
      </g>
    </svg>
    <span className="gift-caption">a little gift, a lot of heart</span>
  </div>;
}

function Avatar() {
  return <svg viewBox="0 0 240 240" fill="none" className="default-avatar" role="img" aria-label="사진 대신 준비한 기본 프로필 일러스트">
    <circle cx="120" cy="120" r="120" fill="#f8e7e9" />
    <circle cx="190" cy="53" r="28" fill="#fff4ee" />
    <path d="M39 240c2-58 30-91 81-91s79 33 81 91" fill="#bd2d47" />
    <ellipse cx="120" cy="104" rx="43" ry="48" fill="#f1c5aa" />
    <path d="M76 104c-7-37 15-63 44-63 36 0 48 25 44 61-6-23-16-30-24-34-9 17-33 27-64 25Z" fill="#523944" />
    <path d="m107 152 13 27 14-27" fill="#fff5ed" />
    <path d="M172 168c-15-15-31 5-13 19l13 10 13-10c18-14 2-34-13-19Z" fill="#ed8093" />
    <path d="m52 63 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z" fill="#c9445c" />
  </svg>;
}

function Confetti() {
  return <div className="confetti" aria-hidden="true">{Array.from({ length: 52 }, (_, i) => <i key={i} style={{ '--x': `${(i * 37) % 100}%`, '--delay': `${(i % 9) * .065}s`, '--duration': `${2.2 + (i % 7) * .18}s`, '--spin': `${i % 2 ? -1 : 1}`, '--color': ['#c73450', '#f6be76', '#e5a1b3', '#a4b9ad', '#fcddd6'][i % 5], '--drift': `${((i * 17) % 160) - 80}px` } as CSSProperties} />)}</div>;
}

export default function App() {
  const [stage, setStage] = useState<Stage>('loading');
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const revealHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let controller: AbortController;
    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      setAssignment(null);
      setPhotoFailed(false);
      if (!window.location.hash) { setStage('invitation'); return; }
      setStage('loading');
      try {
        const { id, key } = parseFragment(window.location.hash);
        const response = await fetch(`/results/${id}.json`, { signal: current.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Missing result');
        const result = await decrypt(await response.json(), key);
        if (current.signal.aborted) return;
        setAssignment(result);
        setStage('ready');
      } catch {
        if (!current.signal.aborted) setStage('error');
      }
    };
    void load();
    window.addEventListener('hashchange', load);
    return () => { controller?.abort(); window.removeEventListener('hashchange', load); };
  }, []);

  useEffect(() => {
    if (stage !== 'opening') return;
    const timer = window.setTimeout(() => setStage('revealed'), 2400);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage === 'revealed') revealHeading.current?.focus({ preventScroll: true });
  }, [stage]);

  function openGift() {
    if (stage !== 'ready') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.matchMedia('(max-width: 720px)').matches) {
      document.querySelector('.card-art')?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    }
    setStage(reducedMotion ? 'revealed' : 'opening');
  }

  const revealed = stage === 'revealed';
  const opening = stage === 'opening';

  return <div className="site-shell">
    <header className="site-header">
      <a href="/" className="brand" aria-label="쓸데있는 선물 교환 처음으로"><span className="brand-mark">BC Card</span><span className="brand-divider" /><span className="brand-label">우리의 따뜻한 겨울</span></a>
      <span className="header-date"><span />12월 5일 · 동기 MT</span>
    </header>

    <main>
      <section className="intro" aria-labelledby="page-title">
        <div className="eyebrow"><span />BC CARD · 2025 하반기 입사 동기<span /></div>
        <h1 id="page-title">쓸데있는<br className="mobile-break" /> <span>선물 교환<svg viewBox="0 0 360 16" preserveAspectRatio="none" aria-hidden="true"><path d="M3 12C94 2 227 1 357 8" /></svg></span><Sparkle className="title-spark" /></h1>
        <p>함께라서 더 따뜻한 12월.<br className="mobile-break" /> 서로에게 쓸모 있는 마음을 선물해요.</p>
      </section>

      {!revealed && <FriendsBanner opening={opening} />}

      <section className={`invitation-card ${revealed ? 'has-revealed' : ''} ${opening ? 'is-opening' : ''}`} aria-label="나의 마니또 초대장">
        <div className="card-art">
          <div className="art-label"><span className="tiny-gift">✳</span> A GIFT FOR YOU</div>
          {revealed && assignment ? <div className="portrait-wrap">
            <div className="portrait-ring"><div className="portrait">{assignment.photo && !photoFailed ? <img src={assignment.photo} alt={`${assignment.recipient}님의 사진`} onError={() => setPhotoFailed(true)} /> : <Avatar />}</div></div>
            <span className="portrait-seal">YOUR<br />MANITTO<span>♥</span></span>
            <Sparkle className="portrait-spark" />
            <p className="portrait-caption">올겨울, 당신의 마음이 닿을 사람</p>
          </div> : <Gift opening={opening} />}
        </div>

        <div className="card-content">
          <div className="letter-top"><span className="section-label">{revealed ? 'THE SECRET IS OUT' : 'A SECRET INVITATION'}</span></div>
          {revealed && assignment ? <div className="result-copy">
            <span className="recipient-label">{assignment.sender}님이 선물할 상대는</span>
            <h2 ref={revealHeading} tabIndex={-1} className="recipient-name">{assignment.recipient}<span>님</span><Sparkle /></h2>
            <div className="result-guide">
              <p><strong>12월 5일 MT</strong>에 선물을 가져와 상대에게 직접 전해주세요.</p>
              <p>예산은 <strong>3만 원 미만</strong>이에요. 너무 부담 갖지 말고, 상대에게 쓸모 있을 것 같은 선물로 편하게 준비해 주세요.</p>
            </div>
            <div className="saved-note"><CheckIcon /> 다시 들어와도 같은 상대를 확인할 수 있어요.</div>
          </div> : <div className="invitation-copy">
            <div className="to-label">TO. <span>{assignment ? `${assignment.sender}님` : '함께하는 우리에게'}</span></div>
            <h2>{opening ? <>당신의 마음이<br />향할 사람은…</> : <>당신의 선물을 기다릴<br />동기는 누구일까요?</>}</h2>
            <p>상자를 열고 선물할 상대를 확인해 주세요.</p>
            {stage === 'error' ? <div className="error-note" role="alert"><strong>초대 링크를 확인해 주세요.</strong><span>링크가 올바르지 않거나 결과를 불러오지 못했어요. 전달받은 링크 전체를 다시 열어주세요.</span><button className="retry-button" onClick={() => window.location.reload()}>다시 시도</button></div> : stage === 'invitation' ? <><div className="invitation-notice"><GiftIcon /> 개인 초대 링크로 접속해 주세요</div><p className="private-note">진행자가 보내준 개인 링크로 상대를 확인할 수 있어요.</p></> : <><button className="open-button" onClick={openGift} disabled={stage !== 'ready'}><GiftIcon />{stage === 'loading' ? '초대장을 확인하고 있어요' : opening ? '두근두근, 열리는 중…' : '내가 선물할 상대 확인하기'}<Sparkle /></button><p className="private-note"><LockIcon /> 나에게만 전해진 비밀 초대장이에요.</p></>}
          </div>}
          <div className="letter-bottom"><span>작은 선물에, 커다란 마음을.</span><span className="handwritten">with love, BC</span></div>
        </div>
        {revealed && <Confetti />}
        <div className="sr-only" role="status" aria-live="polite">{opening ? '선물 상자가 열리고 있습니다.' : stage === 'loading' ? '초대장을 확인하고 있습니다.' : ''}</div>
      </section>

      {(stage === 'invitation' || stage === 'error') && <p className="link-help">개인 초대 링크가 없거나 열리지 않나요? 진행자에게 링크를 다시 요청해 주세요.</p>}
    </main>
    <footer><span>BC CARD · 2025 하반기 동기들</span><span>우리의 겨울에, 작은 즐거움 하나 <span className="footer-heart">♥</span></span></footer>
  </div>;
}

function GiftIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7C4 8 5 1 8 3c2 1 4 4 4 4Zm0 0c8 1 7-6 4-4-2 1-4 4-4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>; }
function LockIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="m8 12 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
