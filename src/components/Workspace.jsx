import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import PolygonAtom from './PolygonAtom';
import AtomCard from './AtomCard';
import LonePair, { LONE_PAIR_W, LONE_PAIR_H } from './LonePair';
import {
  getPolygonRadius,
  getPolygonVertices,
  getEdgeMidpoints,
  dist,
  getCardActiveEdgeMidpoint,
  CARD_SIZE,
} from '../utils/geometry';
import './Workspace.css';

const SNAP_THRESHOLD = 80;
const LP_SNAP_THRESHOLD = 50; // lone pair snap distance

export default function Workspace({
  centralAtom,
  cards,
  lonePairs,
  onUpdateCard,
  onRemoveCard,
  onUpdateLonePair,
  onRemoveLonePair,
}) {
  const containerRef = useRef(null);
  const [size, setSize]           = useState({ w: 800, h: 600 });
  const [dragState, setDragState]     = useState(null);   // card drag
  const [lpDragState, setLpDragState] = useState(null);   // lone-pair drag
  const [snapHoverEdge, setSnapHoverEdge] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const cx = size.w / 2;
  const cy = size.h / 2;

  // Polygon edge midpoints for the central atom
  const edgeMidpoints = useMemo(() => {
    if (!centralAtom) return [];
    const polyN = centralAtom.domains === 2 ? 4 : centralAtom.domains;
    const R = getPolygonRadius(polyN);
    const verts = getPolygonVertices(cx, cy, R, polyN);
    return getEdgeMidpoints(cx, cy, verts);
  }, [centralAtom, cx, cy]);

  const occupiedEdges = useMemo(
    () => cards.filter((c) => c.snappedEdge !== null).map((c) => c.snappedEdge),
    [cards]
  );

  // ── Snap helpers ────────────────────────────────────────────────────────────

  const findSnapEdge = useCallback(
    (cardId, pos, rotation) => {
      if (!edgeMidpoints.length) return null;
      const ep = getCardActiveEdgeMidpoint(pos.x, pos.y, rotation);
      let best = null, bestD = SNAP_THRESHOLD;
      for (const edge of edgeMidpoints) {
        if (cards.some((c) => c.id !== cardId && c.snappedEdge === edge.edgeIndex)) continue;
        const d = dist(ep.x, ep.y, edge.x, edge.y);
        if (d < bestD) { bestD = d; best = edge; }
      }
      return best;
    },
    [edgeMidpoints, cards]
  );

  const snapPositionFromEdge = useCallback((edge) => ({
    x:      edge.x + (CARD_SIZE / 2) * Math.cos(edge.angle),
    y:      edge.y + (CARD_SIZE / 2) * Math.sin(edge.angle),
    rotDeg: (edge.angle * 180) / Math.PI + 90,
  }), []);

  // ── Card drag handlers ───────────────────────────────────────────────────────

  const handleCardPointerDown = useCallback((e, cardId) => {
    e.preventDefault(); e.stopPropagation();
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragState({
      cardId,
      offsetX: e.clientX - rect.left - card.position.x,
      offsetY: e.clientY - rect.top  - card.position.y,
    });
    if (card.snappedEdge !== null) onUpdateCard(cardId, { snappedEdge: null });
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [cards, onUpdateCard]);

  const handlePointerMove = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();

    if (dragState) {
      const pos = {
        x: e.clientX - rect.left - dragState.offsetX,
        y: e.clientY - rect.top  - dragState.offsetY,
      };
      onUpdateCard(dragState.cardId, { position: pos, snappedEdge: null });
      const card = cards.find((c) => c.id === dragState.cardId);
      const snap = findSnapEdge(dragState.cardId, pos, card?.rotation ?? 0);
      setSnapHoverEdge(snap ? snap.edgeIndex : null);
    }

    if (lpDragState) {
      const pos = {
        x: e.clientX - rect.left - lpDragState.offsetX,
        y: e.clientY - rect.top  - lpDragState.offsetY,
      };
      onUpdateLonePair(lpDragState.lpId, { position: pos, snappedTo: null });
    }
  }, [dragState, lpDragState, cards, findSnapEdge, onUpdateCard, onUpdateLonePair]);

  const handlePointerUp = useCallback((e) => {
    if (dragState) {
      const card = cards.find((c) => c.id === dragState.cardId);
      if (card) {
        const snap = findSnapEdge(dragState.cardId, card.position, card.rotation);
        if (snap) {
          const { x, y, rotDeg } = snapPositionFromEdge(snap);
          onUpdateCard(dragState.cardId, {
            position: { x, y }, rotation: rotDeg, snappedEdge: snap.edgeIndex,
          });
        }
      }
      setDragState(null);
      setSnapHoverEdge(null);
    }

    if (lpDragState) {
      const lp = lonePairs.find((l) => l.id === lpDragState.lpId);
      if (lp) {
        // Check if near any card's top-edge (in that card's local space)
        let bestTarget = null, bestD = LP_SNAP_THRESHOLD;
        for (const card of cards) {
          // Top of card in local coords = card center offset by half upward
          // In world coords, "top" of card depends on rotation.
          // Edge 0 (top) midpoint in world space:
          const rot = (card.rotation * Math.PI) / 180;
          // "top" is edge 0: in local coords at (40, 0), which is in the -y direction at 0 rotation
          // After rotation, it's at:
          const topX = card.position.x - (CARD_SIZE / 2) * Math.sin(rot);
          const topY = card.position.y - (CARD_SIZE / 2) * Math.cos(rot);
          const d = dist(lp.position.x, lp.position.y, topX, topY);
          if (d < bestD) {
            bestD = d;
            bestTarget = { cardId: card.id, topX, topY, rot };
          }
        }
        if (bestTarget) {
          onUpdateLonePair(lpDragState.lpId, {
            position: {
              x: bestTarget.topX - (LONE_PAIR_W / 2) * Math.sin(bestTarget.rot),
              y: bestTarget.topY - (LONE_PAIR_H / 2) * Math.cos(bestTarget.rot),
            },
            snappedTo: { cardId: bestTarget.cardId },
          });
        }
      }
      setLpDragState(null);
    }
  }, [dragState, lpDragState, cards, lonePairs, findSnapEdge, snapPositionFromEdge,
      onUpdateCard, onUpdateLonePair]);

  // ── Lone pair drag ────────────────────────────────────────────────────────────

  const handleLpPointerDown = useCallback((e, lpId) => {
    e.preventDefault(); e.stopPropagation();
    const lp = lonePairs.find((l) => l.id === lpId);
    if (!lp) return;
    const rect = containerRef.current.getBoundingClientRect();
    setLpDragState({
      lpId,
      offsetX: e.clientX - rect.left - lp.position.x,
      offsetY: e.clientY - rect.top  - lp.position.y,
    });
    if (lp.snappedTo) onUpdateLonePair(lpId, { snappedTo: null });
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [lonePairs, onUpdateLonePair]);

  const handleRotate = useCallback((cardId, delta) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.snappedEdge !== null) return;
    onUpdateCard(cardId, { rotation: (card.rotation + delta + 360) % 360 });
  }, [cards, onUpdateCard]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="workspace-container" ref={containerRef}>
      {/* SVG layer */}
      <svg
        className="workspace-svg"
        width={size.w}
        height={size.h}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <DotGrid width={size.w} height={size.h} />

        {/* Bond lines */}
        {centralAtom && cards.filter((c) => c.snappedEdge !== null).map((c) => (
          <line key={c.id} x1={cx} y1={cy} x2={c.position.x} y2={c.position.y}
            stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}

        {centralAtom ? (
          <PolygonAtom
            cx={cx} cy={cy}
            n={centralAtom.domains}
            element={centralAtom.element}
            color={centralAtom.color}
            bondPattern={centralAtom.bondPattern}
            occupiedEdges={occupiedEdges}
            snapHoverEdge={snapHoverEdge}
          />
        ) : (
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            fill="rgba(255,255,255,0.13)" fontSize="15" fontFamily="sans-serif">
            ← Select a central atom to begin
          </text>
        )}
      </svg>

      {/* Interactive layer */}
      <div
        className="workspace-cards"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      >
        {cards.map((card) => (
          <AtomCard
            key={card.id}
            card={card}
            isDragging={dragState?.cardId === card.id}
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
            isDragging={lpDragState?.lpId === lp.id}
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
