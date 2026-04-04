import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import PolygonAtom from './PolygonAtom';
import AtomCard from './AtomCard';
import LonePair, { LONE_PAIR_W, LONE_PAIR_H } from './LonePair';
import {
  getPolygonRadius,
  getPolygonVertices,
  getEdgeMidpoints,
  getCardActiveEdgeMidpoint,
  getCardEdgeWorld,
  getLonePairSnapInfo,
  dist,
  CARD_SIZE,
  BOND_SQUARE_SIZE,
} from '../utils/geometry';
import './Workspace.css';

const SNAP_THRESHOLD = 70;    // px — card active-edge to polygon-edge
const LP_SNAP_THRESHOLD = 45; // px — lone pair to non-bond card edge

// Non-bond edge indices for outer atom cards (bond edge = 2/bottom)
const NON_BOND_EDGES = [0, 1, 3];

export default function Workspace({
  centralAtoms,
  cards,
  lonePairs,
  onUpdateCentralAtom,
  onUpdateCard,
  onRemoveCard,
  onUpdateLonePair,
  onRemoveLonePair,
}) {
  const containerRef = useRef(null);
  const [size, setSize]             = useState({ w: 800, h: 600 });
  const [cardDrag, setCardDrag]     = useState(null); // { cardId, offsetX, offsetY }
  const [centralDrag, setCentralDrag] = useState(null); // { centralId, offsetX, offsetY }
  const [lpDrag, setLpDrag]         = useState(null); // { lpId, offsetX, offsetY }
  const [snapHover, setSnapHover]   = useState(null); // { centralId, edgeIndex }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ── Polygon edge data for all central atoms ────────────────────────────────

  const allEdges = useMemo(() => {
    return centralAtoms.flatMap((ca) => {
      const polyN = ca.domains === 2 ? 4 : ca.domains;
      const R = getPolygonRadius(polyN);
      const verts = getPolygonVertices(ca.position.x, ca.position.y, R, polyN);
      return getEdgeMidpoints(ca.position.x, ca.position.y, verts).map((e) => ({
        ...e,
        centralId: ca.id,
      }));
    });
  }, [centralAtoms]);

  const occupiedEdgesFor = useCallback(
    (centralId) =>
      cards
        .filter((c) => c.snappedEdge?.centralId === centralId)
        .map((c) => c.snappedEdge.edgeIndex),
    [cards]
  );

  // ── Card snap helpers ──────────────────────────────────────────────────────

  const findSnapEdge = useCallback(
    (cardId, pos, rotation) => {
      if (!allEdges.length) return null;
      const ep = getCardActiveEdgeMidpoint(pos.x, pos.y, rotation);
      let best = null, bestD = SNAP_THRESHOLD;
      for (const edge of allEdges) {
        const alreadyOccupied = cards.some(
          (c) =>
            c.id !== cardId &&
            c.snappedEdge?.centralId === edge.centralId &&
            c.snappedEdge?.edgeIndex === edge.edgeIndex
        );
        if (alreadyOccupied) continue;
        const d = dist(ep.x, ep.y, edge.x, edge.y);
        if (d < bestD) { bestD = d; best = edge; }
      }
      return best;
    },
    [allEdges, cards]
  );

  const snapPositionFromEdge = useCallback((edge) => ({
    x:      edge.x + (CARD_SIZE / 2) * Math.cos(edge.angle),
    y:      edge.y + (CARD_SIZE / 2) * Math.sin(edge.angle),
    rotDeg: (edge.angle * 180) / Math.PI + 90,
  }), []);

  // ── LP snap helpers ────────────────────────────────────────────────────────

  const findLpSnapEdge = useCallback(
    (lpId, lpPos) => {
      let best = null, bestD = LP_SNAP_THRESHOLD;
      for (const card of cards) {
        for (const edgeIndex of NON_BOND_EDGES) {
          // Skip if another LP is already here
          const occupied = lonePairs.some(
            (lp) =>
              lp.id !== lpId &&
              lp.snappedTo?.cardId === card.id &&
              lp.snappedTo?.edgeIndex === edgeIndex
          );
          if (occupied) continue;

          const edgeWorld = getCardEdgeWorld(card.position.x, card.position.y, card.rotation, edgeIndex);
          const d = dist(lpPos.x, lpPos.y, edgeWorld.x, edgeWorld.y);
          if (d < bestD) {
            bestD = d;
            best = { card, edgeIndex };
          }
        }
      }
      return best;
    },
    [cards, lonePairs]
  );

  // ── Pointer handlers ───────────────────────────────────────────────────────

  // Central atom polygon drag
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
        startX:  ca.position.x,
        startY:  ca.position.y,
      });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [centralAtoms]
  );

  // Outer atom card drag
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

  // Lone pair drag
  const handleLpPointerDown = useCallback(
    (e, lpId) => {
      e.preventDefault();
      e.stopPropagation();
      const lp = lonePairs.find((l) => l.id === lpId);
      if (!lp) return;
      const rect = containerRef.current.getBoundingClientRect();
      setLpDrag({
        lpId,
        offsetX: e.clientX - rect.left - lp.position.x,
        offsetY: e.clientY - rect.top  - lp.position.y,
      });
      if (lp.snappedTo) onUpdateLonePair(lpId, { snappedTo: null, rotation: 0 });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [lonePairs, onUpdateLonePair]
  );

  // Unified pointer move
  const handlePointerMove = useCallback(
    (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (centralDrag) {
        const newPos = { x: mx - centralDrag.offsetX, y: my - centralDrag.offsetY };
        // App.jsx computes drift and cascades updates to snapped cards + lone pairs
        onUpdateCentralAtom(centralDrag.centralId, newPos);
      }

      if (cardDrag) {
        const pos = { x: mx - cardDrag.offsetX, y: my - cardDrag.offsetY };
        onUpdateCard(cardDrag.cardId, { position: pos, snappedEdge: null });
        const card = cards.find((c) => c.id === cardDrag.cardId);
        const snap = findSnapEdge(cardDrag.cardId, pos, card?.rotation ?? 0);
        setSnapHover(snap ? { centralId: snap.centralId, edgeIndex: snap.edgeIndex } : null);
      }

      if (lpDrag) {
        const pos = { x: mx - lpDrag.offsetX, y: my - lpDrag.offsetY };
        onUpdateLonePair(lpDrag.lpId, { position: pos, snappedTo: null });
      }
    },
    [centralDrag, cardDrag, lpDrag, centralAtoms, cards, findSnapEdge,
     onUpdateCentralAtom, onUpdateCard, onUpdateLonePair]
  );

  // Unified pointer up
  const handlePointerUp = useCallback(
    (e) => {
      if (centralDrag) {
        setCentralDrag(null);
      }

      if (cardDrag) {
        const card = cards.find((c) => c.id === cardDrag.cardId);
        if (card) {
          const snap = findSnapEdge(cardDrag.cardId, card.position, card.rotation);
          if (snap) {
            const { x, y, rotDeg } = snapPositionFromEdge(snap);
            onUpdateCard(cardDrag.cardId, {
              position: { x, y },
              rotation: rotDeg,
              snappedEdge: { centralId: snap.centralId, edgeIndex: snap.edgeIndex },
            });
          }
        }
        setCardDrag(null);
        setSnapHover(null);
      }

      if (lpDrag) {
        const lp = lonePairs.find((l) => l.id === lpDrag.lpId);
        if (lp) {
          const target = findLpSnapEdge(lpDrag.lpId, lp.position);
          if (target) {
            const { card, edgeIndex } = target;
            const snapInfo = getLonePairSnapInfo(
              card.position.x, card.position.y, card.rotation, edgeIndex
            );
            onUpdateLonePair(lpDrag.lpId, {
              position:  { x: snapInfo.x, y: snapInfo.y },
              rotation:  snapInfo.rotation,
              snappedTo: { cardId: card.id, edgeIndex },
            });
          }
        }
        setLpDrag(null);
      }
    },
    [centralDrag, cardDrag, lpDrag, cards, lonePairs,
     findSnapEdge, snapPositionFromEdge, findLpSnapEdge, onUpdateCard, onUpdateLonePair]
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
    <div className="workspace-container" ref={containerRef}>
      {/* SVG layer: dot grid + bond hint lines */}
      <svg
        width={size.w}
        height={size.h}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <DotGrid width={size.w} height={size.h} />

        {/* Faint lines from polygon center to snapped cards */}
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

        {/* Central atom polygons (SVG, pointer-events delegated to polygon element) */}
        {centralAtoms.map((ca) => (
          <PolygonAtom
            key={ca.id}
            cx={ca.position.x}
            cy={ca.position.y}
            n={ca.domains}
            element={ca.element}
            color={ca.color}
            bondPattern={ca.bondPattern}
            occupiedEdges={occupiedEdgesFor(ca.id)}
            snapHoverEdge={
              snapHover?.centralId === ca.id ? snapHover.edgeIndex : null
            }
            onPointerDown={(e) => handleCentralPointerDown(e, ca.id)}
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
      </svg>

      {/* Interactive card + LP layer */}
      <div
        style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {cards.map((card) => (
          <AtomCard
            key={card.id}
            card={card}
            isDragging={cardDrag?.cardId === card.id}
            isSnapping={card.snappedEdge !== null}
            onPointerDown={(e) => handleCardPointerDown(e, card.id)}
            onRotateCW={()  => handleRotate(card.id,  90)}
            onRotateCCW={() => handleRotate(card.id, -90)}
            onRemove={() => onRemoveCard(card.id)}
          />
        ))}

        {lonePairs.map((lp) => (
          <LonePair
            key={lp.id}
            lp={lp}
            isDragging={lpDrag?.lpId === lp.id}
            isSnapping={!!lp.snappedTo}
            onPointerDown={(e) => handleLpPointerDown(e, lp.id)}
            onRemove={() => onRemoveLonePair(lp.id)}
          />
        ))}
      </div>
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
