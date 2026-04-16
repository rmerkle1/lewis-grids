import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import PolygonAtom from './PolygonAtom';
import AtomCard from './AtomCard';
import {
  getPolygonRadius,
  getPolygonVertices,
  getEdgeMidpoints,
  getCardActiveEdgeMidpoint,
  dist,
  CARD_SIZE,
  BOND_SQUARE_SIZE,
  BOND_GAP,
} from '../utils/geometry';
import { autoAdjustElectrons } from '../data/atoms';
import './Workspace.css';

const SNAP_THRESHOLD = 70;
const CLICK_MAX_DIST = 5; // px — below this, pointer-up treated as a click

export default function Workspace({
  centralAtoms,
  centralLinks,
  cards,
  selectedCardId,
  activeOverlay,
  onUpdateCentralAtom,
  onRotateCentralAtom,
  onRemoveCentralAtom,
  onUpdateCard,
  onRemoveCard,
  onSelectCard,
  onShuffleCard,
  onSelectCentral,
  onTransferBond,
}) {
  const containerRef = useRef(null);
  const [size, setSize]           = useState({ w: 800, h: 600 });
  const [cardDrag, setCardDrag]   = useState(null);
  // centralDrag: { centralId, offsetX, offsetY, startX, startY }
  const [centralDrag, setCentralDrag] = useState(null);
  const [snapHover, setSnapHover] = useState(null);
  const [bondDrag, setBondDrag] = useState(null);
  // bondDrag: { centralId, fromEdge, ghostX, ghostY } | null

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ── Edge data ──────────────────────────────────────────────────────────────

  const allEdges = useMemo(() => {
    return centralAtoms.flatMap((ca) => {
      const polyN = ca.domains === 2 ? 4 : ca.domains;
      const R = getPolygonRadius(polyN);
      const verts = getPolygonVertices(ca.position.x, ca.position.y, R, polyN, ca.rotation || 0);
      return getEdgeMidpoints(ca.position.x, ca.position.y, verts)
        .filter((e) => ca.bondPattern[e.edgeIndex] != null)
        .map((e) => ({ ...e, centralId: ca.id }));
    });
  }, [centralAtoms]);

  const occupiedEdgesFor = useCallback(
    (centralId) => {
      const fromCards = cards
        .filter((c) => c.snappedEdge?.centralId === centralId)
        .map((c) => c.snappedEdge.edgeIndex);
      const fromLinks = (centralLinks ?? [])
        .filter((l) => l.id1 === centralId || l.id2 === centralId)
        .map((l) => (l.id1 === centralId ? l.edgeIndex1 : l.edgeIndex2));
      return [...fromCards, ...fromLinks];
    },
    [cards, centralLinks]
  );

  // Edge indices that are linked to another central atom (for grey bond-square rendering)
  const caLinkedEdgesFor = useCallback(
    (centralId) =>
      (centralLinks ?? [])
        .filter((l) => l.id1 === centralId || l.id2 === centralId)
        .map((l) => (l.id1 === centralId ? l.edgeIndex1 : l.edgeIndex2)),
    [centralLinks]
  );

  // ── Snap helpers ───────────────────────────────────────────────────────────

  const findSnapEdge = useCallback(
    (cardId, pos, rotation) => {
      if (!allEdges.length) return null;
      const ep = getCardActiveEdgeMidpoint(pos.x, pos.y, rotation);
      let best = null, bestD = SNAP_THRESHOLD;
      for (const edge of allEdges) {
        // Skip edges already occupied by another outer atom card
        const occupiedByCard = cards.some(
          (c) =>
            c.id !== cardId &&
            c.snappedEdge?.centralId === edge.centralId &&
            c.snappedEdge?.edgeIndex === edge.edgeIndex
        );
        if (occupiedByCard) continue;
        // Skip edges occupied by a CA–CA link (those are not available for outer atoms)
        const occupiedByLink = (centralLinks ?? []).some(
          (l) =>
            (l.id1 === edge.centralId && l.edgeIndex1 === edge.edgeIndex) ||
            (l.id2 === edge.centralId && l.edgeIndex2 === edge.edgeIndex)
        );
        if (occupiedByLink) continue;
        const d = dist(ep.x, ep.y, edge.x, edge.y);
        if (d < bestD) { bestD = d; best = edge; }
      }
      return best;
    },
    [allEdges, cards, centralLinks]
  );

  const snapPositionFromEdge = useCallback((edge) => ({
    x:      edge.x + (CARD_SIZE / 2) * Math.cos(edge.angle),
    y:      edge.y + (CARD_SIZE / 2) * Math.sin(edge.angle),
    rotDeg: (edge.angle * 180) / Math.PI + 90,
  }), []);

  // ── Pointer handlers ───────────────────────────────────────────────────────
  // Both handlers live on the workspace-container so they receive events that
  // bubble from SVG children (central atoms) AND HTML children (cards).

  const handleCentralPointerDown = useCallback(
    (e, centralId) => {
      e.preventDefault();
      e.stopPropagation();
      const ca = centralAtoms.find((c) => c.id === centralId);
      if (!ca) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCentralDrag({
        centralId,
        offsetX: e.clientX - rect.left - ca.position.x,
        offsetY: e.clientY - rect.top  - ca.position.y,
        startX:  e.clientX,
        startY:  e.clientY,
      });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [centralAtoms]
  );

  const handleCardPointerDown = useCallback(
    (e, cardId) => {
      e.preventDefault();
      e.stopPropagation();
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCardDrag({
        cardId,
        offsetX: e.clientX - rect.left - card.position.x,
        offsetY: e.clientY - rect.top  - card.position.y,
      });
      if (card.snappedEdge !== null) onUpdateCard(cardId, { snappedEdge: null });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [cards, onUpdateCard]
  );

  const handlePointerMove = useCallback(
    (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (centralDrag) {
        onUpdateCentralAtom(centralDrag.centralId, {
          x: mx - centralDrag.offsetX,
          y: my - centralDrag.offsetY,
        });
      }

      if (cardDrag) {
        const pos = { x: mx - cardDrag.offsetX, y: my - cardDrag.offsetY };
        onUpdateCard(cardDrag.cardId, { position: pos, snappedEdge: null });
        const card = cards.find((c) => c.id === cardDrag.cardId);
        const snap = findSnapEdge(cardDrag.cardId, pos, card?.rotation ?? 0);
        setSnapHover(snap ? { centralId: snap.centralId, edgeIndex: snap.edgeIndex } : null);
      }

      if (bondDrag) {
        setBondDrag((prev) => prev ? { ...prev, ghostX: mx, ghostY: my } : null);
      }
    },
    [centralDrag, cardDrag, bondDrag, cards, findSnapEdge, onUpdateCentralAtom, onUpdateCard]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (centralDrag) {
        // Treat as click if pointer barely moved
        const dx = e.clientX - centralDrag.startX;
        const dy = e.clientY - centralDrag.startY;
        if (Math.sqrt(dx * dx + dy * dy) < CLICK_MAX_DIST) {
          onSelectCentral?.(centralDrag.centralId);
        }
        setCentralDrag(null);
      }

      if (cardDrag) {
        const card = cards.find((c) => c.id === cardDrag.cardId);
        if (card) {
          const snap = findSnapEdge(cardDrag.cardId, card.position, card.rotation);
          if (snap) {
            const { x, y, rotDeg } = snapPositionFromEdge(snap);
            const ca = centralAtoms.find((a) => a.id === snap.centralId);
            const bondOrder = ca?.bondPattern?.[snap.edgeIndex] ?? 1;
            const adjustedElectrons = autoAdjustElectrons(card.electrons, bondOrder);
            onUpdateCard(cardDrag.cardId, {
              position: { x, y },
              rotation: rotDeg,
              snappedEdge: { centralId: snap.centralId, edgeIndex: snap.edgeIndex, bondOrder },
              electrons: adjustedElectrons,
            });
          }
        }
        setCardDrag(null);
        setSnapHover(null);
      }
      if (bondDrag) {
        const { centralId, fromEdge } = bondDrag;
        const rect = containerRef.current.getBoundingClientRect();
        const mx2 = e.clientX - rect.left;
        const my2 = e.clientY - rect.top;
        const ca = centralAtoms.find((c) => c.id === centralId);
        if (ca) {
          const polyN = ca.domains === 2 ? 4 : ca.domains;
          const R = getPolygonRadius(polyN);
          const verts = getPolygonVertices(ca.position.x, ca.position.y, R, polyN, ca.rotation || 0);
          const edges = getEdgeMidpoints(ca.position.x, ca.position.y, verts);
          let best = null, bestD = 60;
          for (const edge of edges) {
            if (edge.edgeIndex === fromEdge) continue;
            if (ca.bondPattern[edge.edgeIndex] == null) continue;
            const d = dist(mx2, my2, edge.x, edge.y);
            if (d < bestD) { bestD = d; best = edge.edgeIndex; }
          }
          if (best !== null) onTransferBond?.(centralId, fromEdge, best);
        }
        setBondDrag(null);
      }
    },
    [centralDrag, cardDrag, bondDrag, cards, centralAtoms, findSnapEdge, snapPositionFromEdge,
     onUpdateCard, onSelectCentral, onTransferBond]
  );

  const handleRotate = useCallback(
    (cardId, delta) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.snappedEdge !== null) return;
      onUpdateCard(cardId, { rotation: (card.rotation + delta + 360) % 360 });
    },
    [cards, onUpdateCard]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="workspace-container"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* SVG layer */}
      <svg
        width={size.w}
        height={size.h}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <DotGrid width={size.w} height={size.h} />

        {centralAtoms.map((ca) =>
          cards
            .filter((c) => c.snappedEdge?.centralId === ca.id)
            .map((c) => (
              <line
                key={c.id}
                x1={ca.position.x} y1={ca.position.y}
                x2={c.position.x}  y2={c.position.y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            ))
        )}

        {(centralLinks ?? []).map((link) => {
          const ca1 = centralAtoms.find((c) => c.id === link.id1);
          const ca2 = centralAtoms.find((c) => c.id === link.id2);
          if (!ca1 || !ca2) return null;
          const polyN1 = ca1.domains === 2 ? 4 : ca1.domains;
          const R1 = getPolygonRadius(polyN1);
          const verts1 = getPolygonVertices(ca1.position.x, ca1.position.y, R1, polyN1, ca1.rotation || 0);
          const edges1 = getEdgeMidpoints(ca1.position.x, ca1.position.y, verts1);
          const e1 = edges1.find((e) => e.edgeIndex === link.edgeIndex1);

          const polyN2 = ca2.domains === 2 ? 4 : ca2.domains;
          const R2 = getPolygonRadius(polyN2);
          const verts2 = getPolygonVertices(ca2.position.x, ca2.position.y, R2, polyN2, ca2.rotation || 0);
          const edges2 = getEdgeMidpoints(ca2.position.x, ca2.position.y, verts2);
          const e2 = edges2.find((e) => e.edgeIndex === link.edgeIndex2);

          if (!e1 || !e2) return null;
          const bondOrder = link.bondOrder ?? 1;
          const dx = e2.x - e1.x;
          const dy = e2.y - e1.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len;
          const ny =  dx / len;
          const offsets = bondOrder === 1 ? [0]
            : bondOrder === 2 ? [-3, 3]
            : [-4, 0, 4];

          return offsets.map((off, i) => (
            <line
              key={`${link.id1}-${link.id2}-${i}`}
              x1={e1.x + nx * off} y1={e1.y + ny * off}
              x2={e2.x + nx * off} y2={e2.y + ny * off}
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ));
        })}

        {centralAtoms.map((ca) => (
          <PolygonAtom
            key={ca.id}
            atomId={ca.id}
            cx={ca.position.x}
            cy={ca.position.y}
            n={ca.domains}
            element={ca.element}
            color={ca.color}
            bondPattern={ca.bondPattern}
            rotation={ca.rotation || 0}
            formalCharge={ca.formalCharge ?? 0}
            baseValence={ca.baseValence ?? 4}
            activeOverlay={activeOverlay}
            occupiedEdges={occupiedEdgesFor(ca.id)}
            caLinkedEdges={caLinkedEdgesFor(ca.id)}
            snapHoverEdge={
              snapHover?.centralId === ca.id ? snapHover.edgeIndex : null
            }
            onPointerDown={(e) => handleCentralPointerDown(e, ca.id)}
            onSelect={() => onSelectCentral?.(ca.id)}
            onBondSquareDragStart={(edgeIndex, e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              const rect = containerRef.current.getBoundingClientRect();
              setBondDrag({
                centralId: ca.id,
                fromEdge: edgeIndex,
                ghostX: e.clientX - rect.left,
                ghostY: e.clientY - rect.top,
              });
            }}
          />
        ))}

        {centralAtoms.length === 0 && (
          <text
            x={size.w / 2} y={size.h / 2}
            textAnchor="middle" dominantBaseline="central"
            fill="rgba(255,255,255,0.12)" fontSize="15" fontFamily="sans-serif"
          >
            ← Select a central atom to begin
          </text>
        )}

        {bondDrag?.ghostX != null && (
          <rect
            x={bondDrag.ghostX - BOND_SQUARE_SIZE / 2}
            y={bondDrag.ghostY - BOND_SQUARE_SIZE / 2}
            width={BOND_SQUARE_SIZE}
            height={BOND_SQUARE_SIZE}
            fill="rgba(255,255,255,0.65)"
            rx="2"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>

      {/* Central atom hover controls */}
      {centralAtoms.map((ca) => {
        const polyN = ca.domains === 2 ? 4 : ca.domains;
        const R = getPolygonRadius(polyN);
        return (
          <div
            key={ca.id}
            className="ca-overlay"
            style={{
              left: ca.position.x - R, top: ca.position.y - R,
              width: R * 2, height: R * 2,
            }}
          >
            <div className="ca-controls" style={{ top: -34, left: '50%' }}>
              <button
                className="ca-rotate-btn"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onRotateCentralAtom(ca.id, -90); }}
                title="Rotate CCW"
              >↺</button>
              <button
                className="ca-rotate-btn"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onRotateCentralAtom(ca.id, 90); }}
                title="Rotate CW"
              >↻</button>
              <button
                className="ca-remove-btn"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onRemoveCentralAtom(ca.id); }}
                title="Remove atom"
              >×</button>
            </div>
          </div>
        );
      })}

      {/* Card layer — pointer-events: none on the div itself so it doesn't
          block clicks on the SVG polygon below; cards inside still get events */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {cards.map((card) => (
          <AtomCard
            key={card.id}
            card={card}
            isDragging={cardDrag?.cardId === card.id}
            isSnapping={card.snappedEdge !== null}
            isSelected={selectedCardId === card.id}
            activeOverlay={activeOverlay}
            onPointerDown={(e) => handleCardPointerDown(e, card.id)}
            onRotateCW={()  => handleRotate(card.id,  90)}
            onRotateCCW={() => handleRotate(card.id, -90)}
            onRemove={() => onRemoveCard(card.id)}
            onSelect={() => onSelectCard(card.id)}
            onShuffle={() => onShuffleCard?.(card.id)}
          />
        ))}
      </div>

      {/* Bond bridge layer — above card glow effects */}
      <svg
        width={size.w}
        height={size.h}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 150 }}
      >
        {cards.filter((c) => c.snappedEdge).flatMap((card) => {
          const edge = allEdges.find(
            (e) => e.centralId === card.snappedEdge.centralId && e.edgeIndex === card.snappedEdge.edgeIndex
          );
          if (!edge) return [];
          const bo = card.snappedEdge.bondOrder ?? 1;
          const rectW = BOND_SQUARE_SIZE;
          const rectH = BOND_SQUARE_SIZE * 2;
          const total = bo * rectW + (bo - 1) * BOND_GAP;
          const angleDeg = (edge.angle * 180) / Math.PI;
          return Array.from({ length: bo }, (_, i) => {
            const offset = -total / 2 + rectW / 2 + i * (rectW + BOND_GAP);
            return (
              <rect
                key={`bridge-${card.id}-${i}`}
                x={edge.x - rectW / 2 + offset}
                y={edge.y - rectH / 2}
                width={rectW}
                height={rectH}
                fill="#3a4554"
                rx="2"
                style={{ pointerEvents: 'none' }}
                transform={`rotate(${angleDeg - 90}, ${edge.x}, ${edge.y})`}
              />
            );
          });
        })}
      </svg>
    </div>
  );
}

function DotGrid({ width, height }) {
  const spacing = 40;
  const dots = [];
  for (let x = spacing; x < width; x += spacing)
    for (let y = spacing; y < height; y += spacing)
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={1} fill="rgba(255,255,255,0.05)" />);
  return <g>{dots}</g>;
}
