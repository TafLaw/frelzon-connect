import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import ConnectLogo from '../components/ConnectLogo'
import jumpingLottie from '../assets/Jumping Lottie Animation.svg'
import trophySvg from '../assets/Trophy.svg'

const REVEAL_JUMP_MS = 4000

const CONFETTI_COLORS = [
  '#6921D6',
  'var(--green)',
  'var(--amber)',
  'oklch(65% 0.2 330)',
  'oklch(62% 0.18 220)',
  'oklch(58% 0.16 145)',
]

function ConfettiBurst({ burstKey }) {
  const pieces = useMemo(
    () => Array.from({ length: 52 }, (_, i) => ({
      id: `${burstKey}-${i}`,
      left: `${4 + Math.random() * 92}%`,
      delay: `${Math.random() * 0.4}s`,
      duration: `${1.3 + Math.random() * 0.9}s`,
      drift: `${-50 + Math.random() * 100}px`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotation: `${Math.random() * 720}deg`,
      w: `${5 + Math.random() * 6}px`,
      h: `${8 + Math.random() * 9}px`,
      round: Math.random() > 0.45,
    })),
    [burstKey],
  )

  return (
    <div className="random-winner-confetti" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`random-winner-confetti-piece${p.round ? ' random-winner-confetti-piece--round' : ''}`}
          style={{
            left: p.left,
            width: p.w,
            height: p.h,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--confetti-drift': p.drift,
            '--confetti-rotation': p.rotation,
          }}
        />
      ))}
    </div>
  )
}

function parseNames(text) {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function shufflePick(items, count) {
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.min(count, pool.length))
}

function TrophyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 5h8v1.5a3.5 3.5 0 01-7 0V5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M6 5H4.5a1.5 1.5 0 001.5 1.5M18 5h1.5a1.5 1.5 0 00-1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 9.5V12M9.5 19h5M10.5 16h3l.75 3h-4.5l.75-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WinnerPoster({ winners, celebrationId }) {
  const winnerLabel = winners.length === 1 ? '1 lucky winner' : `${winners.length} lucky winners`

  return (
    <div className="random-winner-poster">
      <header className="random-winner-poster-header">
        <div className="random-winner-poster-sparkles" aria-hidden>
          <span /><span /><span /><span /><span /><span />
        </div>
        <div className="random-winner-poster-logo">
          <ConnectLogo height={38} />
        </div>
        <object
          type="image/svg+xml"
          data={trophySvg}
          className="random-winner-poster-trophy"
          aria-hidden
        />
        <h2 className="random-winner-poster-winners">Winners</h2>
        <p className="random-winner-poster-congrats">Congratulations!</p>
      </header>

      <div className="random-winner-poster-divider">
        <span className="random-winner-poster-divider-line" aria-hidden />
        <p className="random-winner-poster-divider-text">
          {winnerLabel} drawn from the list
        </p>
        <span className="random-winner-poster-divider-line" aria-hidden />
      </div>

      <ol className="random-winner-list">
        {winners.map((name, i) => (
          <li
            key={`${name}-${i}-${celebrationId}`}
            className="random-winner-list-item random-winner-list-item--celebrate"
            style={{ animationDelay: `${0.2 + i * 0.12}s` }}
          >
            <span className="random-winner-rank">{i + 1}</span>
            <span className="random-winner-card-divider" aria-hidden />
            <span className="random-winner-name">{name}</span>
            <span className="random-winner-prize-icon">
              <TrophyIcon />
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Btn({ children, primary, onClick, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 20px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        border: primary ? 'none' : '1px solid var(--border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'DM Sans, sans-serif',
        background: primary ? 'var(--purple)' : 'var(--bg3)',
        color: primary ? '#fff' : 'var(--text2)',
        opacity: disabled ? 0.55 : 1,
        transition: 'background 0.15s, opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

export default function RandomWinner({ onExit }) {
  const [namesText, setNamesText] = useState('')
  const [winnerCount, setWinnerCount] = useState('1')
  const [winners, setWinners] = useState([])
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [picking, setPicking] = useState(false)
  const [celebrationId, setCelebrationId] = useState(0)
  const [revealPhase, setRevealPhase] = useState(null)
  const revealTimerRef = useRef(null)

  useEffect(() => () => {
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current)
  }, [])

  const clearRevealTimer = () => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
  }

  const startRevealSequence = useCallback(() => {
    clearRevealTimer()
    setRevealPhase('jumping')
    revealTimerRef.current = window.setTimeout(() => {
      setRevealPhase('revealed')
      revealTimerRef.current = null
    }, REVEAL_JUMP_MS)
  }, [])

  const pickWinners = useCallback(() => {
    setError('')
    setInfo('')
    const names = parseNames(namesText)
    const count = parseInt(winnerCount, 10)

    if (names.length === 0) {
      setWinners([])
      setError('Add at least one name (one per line, or separated by commas).')
      return
    }
    if (!Number.isFinite(count) || count < 1) {
      setWinners([])
      setError('Number of winners must be at least 1.')
      return
    }
    if (count > names.length) {
      setInfo(`Only ${names.length} ${names.length === 1 ? 'person' : 'people'} in the list — picking all of them.`)
    }

    setPicking(true)
    setWinners([])
    setRevealPhase(null)
    clearRevealTimer()

    window.setTimeout(() => {
      setWinners(shufflePick(names, count))
      setCelebrationId((c) => c + 1)
      setPicking(false)
      startRevealSequence()
    }, 420)
  }, [namesText, winnerCount, startRevealSequence])

  const clearAll = () => {
    setNamesText('')
    setWinnerCount('1')
    setWinners([])
    setError('')
    setInfo('')
    setCelebrationId(0)
    setRevealPhase(null)
    clearRevealTimer()
  }

  const nameCount = parseNames(namesText).length
  const showingWinners = !picking && winners.length > 0
  const showingJump = showingWinners && revealPhase === 'jumping'
  const showingReveal = showingWinners && revealPhase === 'revealed'

  const pickAgain = () => {
    setWinners([])
    setError('')
    setInfo('')
    setRevealPhase(null)
    clearRevealTimer()
  }

  return (
    <div className="random-winner-page">
      <header className="random-winner-header">
        <button type="button" className="random-winner-logo-btn" onClick={onExit} aria-label="Back to store">
          <ConnectLogo height={32} />
        </button>
        <Btn onClick={onExit}>← Back to Store</Btn>
      </header>

      <main className="random-winner-main">
        <div className={`random-winner-card${showingWinners ? ' random-winner-card--results' : ''}`}>
          {!showingWinners && (
            <>
              <h1 className="random-winner-title">Random winner picker</h1>
              <p className="random-winner-subtitle">
                Paste a list of names, choose how many winners you need, and let chance decide.
              </p>

              <label className="random-winner-label" htmlFor="random-winner-names">
                Names
                <span className="random-winner-label-hint">
                  {nameCount > 0 ? `${nameCount} in list` : 'One per line or comma-separated'}
                </span>
              </label>
              <textarea
                id="random-winner-names"
                className="random-winner-textarea"
                rows={10}
                placeholder={'Alice\nBob\nCharlie\nDiana'}
                value={namesText}
                onChange={(e) => {
                  setNamesText(e.target.value)
                  setError('')
                  setInfo('')
                }}
              />

              <label className="random-winner-label" htmlFor="random-winner-count">
                Number of winners
              </label>
              <input
                id="random-winner-count"
                className="random-winner-count-input"
                type="number"
                min={1}
                value={winnerCount}
                onChange={(e) => {
                  setWinnerCount(e.target.value)
                  setError('')
                  setInfo('')
                }}
              />

              {error && <p className="random-winner-error" role="alert">{error}</p>}
              {info && !error && <p className="random-winner-info">{info}</p>}

              <div className="random-winner-actions">
                <Btn primary onClick={pickWinners} disabled={picking}>
                  {picking ? 'Picking…' : 'Pick winners'}
                </Btn>
                <Btn onClick={clearAll} disabled={picking}>Clear</Btn>
              </div>
            </>
          )}

          {(winners.length > 0 || picking) && (
            <section
              className={`random-winner-results${showingWinners ? ' random-winner-results--solo' : ''}${showingReveal ? ' random-winner-results--celebrate' : ''}${showingJump ? ' random-winner-results--jump' : ''}`}
              aria-live="polite"
            >
              {picking && (
                <>
                  <h2 className="random-winner-results-title">Selecting…</h2>
                  <div className="random-winner-spinner" aria-hidden />
                </>
              )}
              {showingJump && (
                <div className="random-winner-jump-stage">
                  <div className="random-winner-jump-sparkles" aria-hidden>
                    <span /><span /><span /><span /><span /><span />
                  </div>
                  <div className="random-winner-jump-visual">
                    <div className="random-winner-jump-glow" aria-hidden />
                    <object
                      type="image/svg+xml"
                      data={jumpingLottie}
                      className="random-winner-jumping-lottie"
                      aria-hidden
                    />
                  </div>
                  <p className="random-winner-jump-caption">
                    <span className="random-winner-jump-caption-prefix">And the</span>
                    <span className="random-winner-jump-caption-line">
                      <span className="random-winner-jump-caption-highlight">winner is</span>
                      <span className="random-winner-jump-dots" aria-hidden>
                        <span /><span /><span />
                      </span>
                    </span>
                  </p>
                </div>
              )}
              {showingReveal && (
                <>
                  <ConfettiBurst burstKey={celebrationId} />
                  <WinnerPoster winners={winners} celebrationId={celebrationId} />
                  <div className="random-winner-results-actions">
                    <Btn primary onClick={pickAgain}>Pick again</Btn>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
