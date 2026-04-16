import { useState, useCallback, useMemo } from 'react';
import { MOLECULES } from '../data/molecules';
import './PracticePanel.css';

// ── Answer checker ────────────────────────────────────────────────────────────

const ORDER_NAMES = { 1: 'single', 2: 'double', 3: 'triple' };

function checkAnswer(centralAtoms, cards, molecule, polarAnswer, testOptions) {
  const issues = [];

  // ── Lewis structure ────────────────────────────────────────────────────────
  if (testOptions.lewis) {
    if (!centralAtoms.length) {
      return {
        correct: false,
        issues: ['Start by selecting a central atom from the palette on the left.'],
      };
    }

    const ca = centralAtoms[0];

    if (ca.element !== molecule.centralElement) {
      return {
        correct: false,
        issues: [`The central atom for ${molecule.formula} should be ${molecule.centralElement}, not ${ca.element}.`],
      };
    }

    if (ca.domains !== molecule.centralDomains) {
      issues.push(
        `${molecule.domainHint} ` +
        `Currently set to ${ca.domains} domain${ca.domains !== 1 ? 's' : ''} — adjust the slider in the central atom editor.`
      );
    }

    const snapped = cards.filter((c) => c.snappedEdge?.centralId === ca.id);

    const expected = {};
    for (const b of molecule.bonds) {
      const k = `${b.element}|${b.bondOrder}`;
      expected[k] = (expected[k] || 0) + 1;
    }
    const actual = {};
    for (const c of snapped) {
      const el = c.element || c.label;
      const order = c.snappedEdge?.bondOrder ?? 1;
      const k = `${el}|${order}`;
      actual[k] = (actual[k] || 0) + 1;
    }

    const remExp = { ...expected };
    const remAct = { ...actual };
    for (const k of Object.keys(remExp)) {
      const matched = Math.min(remExp[k] ?? 0, remAct[k] ?? 0);
      remExp[k] -= matched;
      if (remExp[k] <= 0) delete remExp[k];
      remAct[k] = (remAct[k] ?? 0) - matched;
      if ((remAct[k] ?? 0) <= 0) delete remAct[k];
    }

    for (const [k, cnt] of Object.entries(remExp)) {
      if (!cnt) continue;
      const [el, order] = k.split('|');
      const wrongOrderKey = Object.keys(remAct).find((rk) => rk.startsWith(el + '|'));
      if (wrongOrderKey) {
        const actualOrder = wrongOrderKey.split('|')[1];
        issues.push(
          `The ${el}–${molecule.centralElement} bond should be ${ORDER_NAMES[order] || `${order}-order`}, not ${ORDER_NAMES[actualOrder] || `${actualOrder}-order`}. ` +
          `Use the bond-order buttons on the central atom editor.`
        );
      } else {
        issues.push(
          `You need ${cnt > 1 ? cnt + ' ' : ''}${el} atom${cnt > 1 ? 's' : ''} bonded to ${molecule.centralElement}. ` +
          `Snap ${cnt > 1 ? 'them' : 'it'} onto an active edge of the central atom.`
        );
      }
    }

    for (const [k, cnt] of Object.entries(remAct)) {
      if (!cnt) continue;
      const [el] = k.split('|');
      if (!Object.keys(expected).some((ek) => ek.startsWith(el + '|'))) {
        issues.push(`${el} is not bonded to ${molecule.centralElement} in ${molecule.formula}.`);
      }
    }
  }

  // ── Polarity ───────────────────────────────────────────────────────────────
  if (testOptions.polarity) {
    if (polarAnswer === null) {
      issues.push('Answer the polar / nonpolar question.');
    } else {
      const correct = molecule.isPolar ? 'polar' : 'nonpolar';
      if (polarAnswer !== correct) {
        issues.push(`${molecule.formula} is actually ${correct}. ${molecule.polarityReason}`);
      }
    }
  }

  return { correct: issues.length === 0, issues };
}

// ── Component ─────────────────────────────────────────────────────────────────

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

export default function PracticePanel({ centralAtoms, cards, expanded, onToggle }) {
  // Persistent options — never reset when switching molecules
  const [testOptions, setTestOptions]   = useState({ lewis: true, polarity: true });
  const [diffFilter, setDiffFilter]     = useState('all');

  // Per-question state — reset on molecule change
  const [moleculeId, setMoleculeId]     = useState(MOLECULES[0].id);
  const [polarAnswer, setPolar]         = useState(null);
  const [result, setResult]             = useState(null);
  const [submitted, setSubmitted]       = useState(false);

  // Filtered molecule list
  const filtered = useMemo(
    () => diffFilter === 'all' ? MOLECULES : MOLECULES.filter((m) => m.difficulty === diffFilter),
    [diffFilter]
  );

  // Resolve current molecule (fall back to first if filter knocked it out)
  const molecule = filtered.find((m) => m.id === moleculeId) ?? filtered[0];
  const filteredIdx = filtered.indexOf(molecule);

  const switchTo = useCallback((id) => {
    setMoleculeId(id);
    setPolar(null);
    setResult(null);
    setSubmitted(false);
  }, []);

  const handleNext = useCallback(() => {
    const next = filtered[(filteredIdx + 1) % filtered.length];
    switchTo(next.id);
  }, [filtered, filteredIdx, switchTo]);

  const handleRandom = useCallback(() => {
    const pool = filtered.filter((m) => m.id !== molecule.id);
    const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : molecule;
    switchTo(pick.id);
  }, [filtered, molecule, switchTo]);

  const handleSubmit = useCallback(() => {
    setResult(checkAnswer(centralAtoms, cards, molecule, polarAnswer, testOptions));
    setSubmitted(true);
  }, [centralAtoms, cards, molecule, polarAnswer, testOptions]);

  const toggleOption = (key) => {
    setTestOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    setResult(null);
    setSubmitted(false);
  };

  const handleDiffFilter = (d) => {
    setDiffFilter(d);
    setResult(null);
    setSubmitted(false);
    // If current molecule not in new filtered set, auto-advance
  };

  const neitherChecked = !testOptions.lewis && !testOptions.polarity;

  return (
    <div className={`practice-panel${expanded ? ' expanded' : ''}`}>

      {/* ── Vertical tab ── */}
      <button
        className="practice-tab"
        onClick={onToggle}
        aria-label={expanded ? 'Close practice panel' : 'Open practice panel'}
      >
        <span className="practice-tab-text">Practice</span>
        <span className="practice-tab-chevron">{expanded ? '›' : '‹'}</span>
      </button>

      {/* ── Panel body ── */}
      <div className="practice-body">

        {/* Header */}
        <div className="practice-header">
          <span className="practice-heading">Practice Mode</span>
          <button className="practice-shuffle-btn" onClick={handleRandom} title="Pick a different molecule">↻</button>
        </div>

        {/* Target molecule */}
        <div className="practice-target">
          <div className="practice-formula">{molecule.formula}</div>
          <div className="practice-mol-name">{molecule.name}</div>
        </div>

        {/* Difficulty filter */}
        <div className="practice-diff-row">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`practice-diff-btn diff-${d}${diffFilter === d ? ' active' : ''}`}
              onClick={() => handleDiffFilter(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Test-options checkboxes */}
        <div className="practice-options">
          <label className="practice-option-label">
            <input
              type="checkbox"
              checked={testOptions.lewis}
              onChange={() => toggleOption('lewis')}
            />
            Lewis Structure
          </label>
          <label className="practice-option-label">
            <input
              type="checkbox"
              checked={testOptions.polarity}
              onChange={() => toggleOption('polarity')}
            />
            Polarity
          </label>
        </div>

        {/* Instructions */}
        {testOptions.lewis && (
          <p className="practice-instructions">
            Build the Lewis structure for <strong>{molecule.formula}</strong> using the palette, then snap outer atoms onto the central atom.
          </p>
        )}

        {/* Polarity question — only when checked */}
        {testOptions.polarity && (
          <div className="practice-section">
            <div className="practice-q">Is {molecule.formula} polar or nonpolar?</div>
            <div className="practice-choices">
              {['polar', 'nonpolar'].map((opt) => (
                <button
                  key={opt}
                  className={`practice-choice${polarAnswer === opt ? ' chosen' : ''}`}
                  onClick={() => { setPolar(opt); if (submitted) setSubmitted(false); setResult(null); }}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main action button */}
        {!neitherChecked && (
          submitted ? (
            <button className="practice-submit" onClick={handleNext}>
              Next →
            </button>
          ) : (
            <button className="practice-submit" onClick={handleSubmit}>
              Check Answer
            </button>
          )
        )}

        {/* Feedback */}
        {result && (
          <div className={`practice-result ${result.correct ? 'ok' : 'err'}`}>
            {result.correct ? (
              <>
                <div className="result-icon">✓</div>
                <div className="result-title">Correct!</div>
                <div className="result-body">
                  {molecule.formula} has <em>{molecule.geometry}</em> geometry
                  {testOptions.polarity && (
                    <> and is {molecule.isPolar ? 'polar' : 'nonpolar'}. {molecule.polarityReason}</>
                  )}.
                </div>
              </>
            ) : (
              <>
                <div className="result-title">Not quite — some hints:</div>
                <ul className="result-hints">
                  {result.issues.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Progress dots */}
        <div className="practice-dots">
          {filtered.map((m) => (
            <button
              key={m.id}
              className={`practice-dot${m.id === molecule.id ? ' active' : ''}`}
              onClick={() => switchTo(m.id)}
              title={m.formula}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
