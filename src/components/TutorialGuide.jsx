import { useState, useEffect } from 'react';
import './TutorialGuide.css';

const TOTAL = 12;
const PANEL_W = 288;
const PANEL_H_EST = 190; // estimated height for placement calculations
const GAP = 14;
const PAD = 10;

// Per-step configuration — target() returns the DOM element to highlight & position against
const STEPS = {
  1: {
    icon: '⬡',
    title: 'Add Oxygen',
    body: 'Click O in the Central Atom panel on the left. It will appear in the workspace as a square polygon.',
    target: () => document.querySelectorAll('.palette-section')[0],
    posHint: 'right',
  },
  2: {
    icon: '◈',
    title: 'Oxygen Has 4 Domains',
    body: "The editor below shows O's electron domains. O needs exactly 4 for H₂O: 2 bond sites and 2 lone pairs. Confirm the slider shows 4, then click Next.",
    target: () => document.querySelector('.ca-overlay'),
    posHint: 'right',
    advance: 'next',
  },
  3: {
    icon: '◻',
    title: 'Add Two Hydrogens',
    body: 'Click H in the Outer Atoms panel twice. Two H bonding cards will appear in the workspace.',
    target: () => document.querySelectorAll('.palette-section')[1],
    posHint: 'right',
  },
  4: {
    icon: '☝',
    title: 'Select an H Atom',
    body: 'Click one of the H cards in the workspace. The editor that appears shows its electron count — you can change it here if needed, but for H₂O no adjustment is required.',
    target: null,
    posHint: 'paletteRight',
    // advance: auto — fires in App.jsx when selectedCardId is set
  },
  5: {
    icon: '⇄',
    title: 'Bond H to O',
    body: 'Drag each H card toward an edge of O — they snap in automatically to form the two O–H single bonds.',
    target: null,
    posHint: 'paletteRight',
  },
  6: {
    icon: '⊕',
    title: 'Check Formal Charge',
    body: 'Click Formal Charge in the Layers toolbar to see the charge on each atom in H₂O.',
    target: () => document.querySelector('.layer-controls'),
    posHint: 'below',
  },
  7: {
    icon: '✓',
    title: 'Check the Octet Rule',
    body: 'Now click Octet Rule. Each atom that satisfies its octet gets a checkmark.',
    target: () => document.querySelector('.layer-controls'),
    posHint: 'below',
  },
  8: {
    icon: '↗',
    title: 'View the 2D Structure',
    body: 'Click 2D in the Layers toolbar to see a clean Lewis structure diagram of H₂O.',
    target: () => document.querySelector('.layer-controls'),
    posHint: 'below',
  },
  9: {
    icon: '⊙',
    title: 'View 3D Geometry',
    body: "Close the 2D view, then click 3D in the toolbar to see H₂O's bent VSEPR geometry.",
    target: () => document.querySelector('.layer-controls'),
    posHint: 'below',
  },
  10: {
    icon: '◑',
    title: 'Show Polarity',
    body: 'In the 3D viewer, click the Polarity toggle to reveal the electron cloud and dipole moment. Click and drag on the molecule to rotate it.',
    target: null,
    advance: 'next',
  },
  11: {
    icon: '▶',
    title: 'Open Practice Panel',
    body: 'Click the Practice tab on the right edge of the screen to open the practice panel.',
    target: () => document.querySelector('.practice-tab'),
    posHint: 'topLeft',
  },
  12: {
    icon: '◉',
    title: 'Answer the Practice',
    body: 'The question shows H₂O. Select Polar, then click Check Answer — it checks both how you drew the Lewis structure and your polarity answer.',
    target: null,
    posHint: 'practiceLeft',
    advance: 'done',
  },
};

// Compute where to place the floating panel based on the highlighted element's bounding rect.
function computePanelStyle(el, posHint) {
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  // Named shortcuts for fixed / special positions
  if (posHint === 'paletteRight') {
    // Centered in the left portion of the workspace — between the palette and the editor
    return { position: 'fixed', left: 276, top: Math.max(PAD, Math.round(vpH * 0.35 - PANEL_H_EST / 2)) };
  }
  if (posHint === 'practiceLeft') {
    // Left of the open practice panel (300px wide) with a small buffer
    return { position: 'fixed', top: 80, right: 320 };
  }

  if (!el) {
    if (posHint === 'bottomRight') {
      return { position: 'fixed', bottom: 24, right: 16 };
    }
    // Default: center-bottom
    return {
      position: 'fixed',
      bottom: 24,
      left: Math.max(PAD, Math.round((vpW - PANEL_W) / 2)),
    };
  }

  const rect = el.getBoundingClientRect();

  // Resolve placement direction
  let placement = posHint;
  if (!placement) {
    if (rect.right  < vpW * 0.4)     placement = 'right';
    else if (rect.left > vpW * 0.6)  placement = 'left';
    else if (rect.top  < vpH * 0.45) placement = 'below';
    else                             placement = 'above';
  }

  let top, left;

  if (placement === 'right') {
    left = rect.right + GAP;
    top  = Math.round(rect.top + rect.height / 2 - PANEL_H_EST / 2);
  } else if (placement === 'left') {
    left = rect.left - PANEL_W - GAP;
    top  = Math.round(rect.top + rect.height / 2 - PANEL_H_EST / 2);
  } else if (placement === 'topLeft') {
    // Left of element, anchored near its top — keeps panel high on screen
    left = rect.left - PANEL_W - GAP;
    top  = Math.max(PAD, rect.top + PAD);
  } else if (placement === 'below') {
    top  = rect.bottom + GAP;
    left = Math.round(rect.left + rect.width / 2 - PANEL_W / 2);
  } else { // above
    top  = rect.top - PANEL_H_EST - GAP;
    left = Math.round(rect.left + rect.width / 2 - PANEL_W / 2);
  }

  // Clamp within viewport
  if (left !== undefined) left = Math.max(PAD, Math.min(vpW - PANEL_W - PAD, left));
  if (top  !== undefined) top  = Math.max(PAD, Math.min(vpH - PANEL_H_EST - PAD, top));

  return { position: 'fixed', top, left };
}

export default function TutorialGuide({ step, onStart, onNext, onSkip, onDone }) {
  const [panelStyle, setPanelStyle] = useState({ position: 'fixed', bottom: 24, right: 16 });

  useEffect(() => {
    const info = STEPS[step];
    if (!info) return;

    const getEl = info.target;
    const el = getEl ? getEl() : null;

    // Apply highlight ring — outline only, no position change
    if (el) el.classList.add('tutorial-highlight');

    // Position the panel adjacent to the highlighted element
    setPanelStyle(computePanelStyle(el, info.posHint ?? null));

    return () => {
      if (el) el.classList.remove('tutorial-highlight');
    };
  }, [step]);

  if (step === 0) return <Welcome onStart={onStart} onSkip={onSkip} />;
  if (step > TOTAL) return <Completion onDone={onDone} />;

  const info = STEPS[step];
  if (!info) return null;

  return (
    <div className="tg-panel" style={panelStyle}>
      <div className="tg-head">
        <div className="tg-progress-bar">
          <div
            className="tg-progress-fill"
            style={{ width: `${((step - 1) / TOTAL) * 100}%` }}
          />
        </div>
        <span className="tg-counter">Step {step} of {TOTAL}</span>
        <button className="tg-x" onClick={onSkip} title="Skip tutorial">✕</button>
      </div>

      <div className="tg-body">
        <div className="tg-step-title">
          <span className="tg-icon" aria-hidden="true">{info.icon}</span>
          {info.title}
        </div>
        <p className="tg-desc">{info.body}</p>
      </div>

      <div className="tg-foot">
        {info.advance === 'next' && (
          <button className="tg-btn" onClick={onNext}>Next →</button>
        )}
        {info.advance === 'done' && (
          <button className="tg-btn" onClick={onNext}>Finish Tutorial</button>
        )}
        {!info.advance && (
          <span className="tg-auto">Complete the action above to continue…</span>
        )}
      </div>
    </div>
  );
}

function Welcome({ onStart, onSkip }) {
  return (
    <div className="tg-overlay" onClick={onSkip}>
      <div className="tg-welcome" onClick={(e) => e.stopPropagation()}>
        <div className="tg-welcome-icon" aria-hidden="true">⬡</div>
        <h2 className="tg-welcome-title">Welcome to Lewis Grids</h2>
        <p className="tg-welcome-sub">
          We'll build water (H₂O) step by step — placing atoms, forming bonds, exploring views, and checking your work in Practice Mode.
        </p>
        <button className="tg-btn tg-btn--lg" onClick={onStart}>Start Tutorial</button>
        <button className="tg-link" onClick={onSkip}>Skip — I'll explore on my own</button>
      </div>
    </div>
  );
}

function Completion({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="tg-done">
      <span className="tg-done-check" aria-hidden="true">✓</span>
      <span className="tg-done-text">Tutorial complete — you've built H₂O!</span>
      <button className="tg-x" onClick={onDone} title="Close">✕</button>
    </div>
  );
}
