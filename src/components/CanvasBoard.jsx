import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export const LOGICAL_W = 850;
export const LOGICAL_H = 1100;

function strokeWidthAt(p0, p1, base) {
  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  const penAngle = Math.PI / 4.2;
  const w = base * (0.35 + 0.9 * Math.abs(Math.cos(angle - penAngle)));
  return Math.max(1.2, w);
}

function TextEditorOverlay({ x, y, font, onAdd, onCancel }) {
  const [value, setValue] = useState('');
  const taRef = useRef(null);
  useEffect(() => { taRef.current?.focus(); }, []);
  return (
    <div className="text-editor" style={{ left: x, top: y }}>
      <textarea
        ref={taRef}
        placeholder="Write your note…"
        style={{ fontFamily: font }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="te-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="button" onClick={() => onAdd(value)}>Add</button>
      </div>
    </div>
  );
}

const CanvasBoard = forwardRef(function CanvasBoard(
  { tool, penColor, penSize, eraserSize, textColor, textFont, textSize, paperTone, paperStyle, onAfterImageInsert },
  ref
) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const objectsRef = useRef([]);
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const draggingRef = useRef(null);
  const selectedRef = useRef(null);
  const imgCacheRef = useRef({});
  const inkLayerRef = useRef(null);

  const propsRef = useRef({});
  propsRef.current = { tool, penColor, penSize, eraserSize, textColor, textFont, textSize };

  const [editor, setEditor] = useState(null);

  const getCtx = () => canvasRef.current.getContext('2d');

  function fitCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_W * dpr;
    canvas.height = LOGICAL_H * dpr;
    canvas.style.width = LOGICAL_W + 'px';
    canvas.style.height = LOGICAL_H + 'px';
    const ctx = getCtx();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  useEffect(() => {
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    return () => window.removeEventListener('resize', fitCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperTone, paperStyle]);

  function pushHistory() {
    historyRef.current.push(JSON.stringify(objectsRef.current));
    if (historyRef.current.length > 60) historyRef.current.shift();
    redoRef.current = [];
  }
  function undo() {
    if (!historyRef.current.length) return;
    redoRef.current.push(JSON.stringify(objectsRef.current));
    objectsRef.current = JSON.parse(historyRef.current.pop());
    selectedRef.current = null;
    redraw();
  }
  function redo() {
    if (!redoRef.current.length) return;
    historyRef.current.push(JSON.stringify(objectsRef.current));
    objectsRef.current = JSON.parse(redoRef.current.pop());
    selectedRef.current = null;
    redraw();
  }
  function clearAll() {
    if (!objectsRef.current.length) return;
    pushHistory();
    objectsRef.current = [];
    selectedRef.current = null;
    redraw();
  }

  function getImage(src, cb) {
    const cache = imgCacheRef.current;
    if (cache[src] && cache[src].complete) { cb(cache[src]); return; }
    const im = new Image();
    im.onload = () => { cache[src] = im; cb(im); redraw(); };
    im.src = src;
  }

  function drawStrokeObj(ctx, o) {
    if (o.points.length < 1) return;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = o.mode === 'erase' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = o.color;

    if (o.points.length === 1) {
      ctx.beginPath();
      ctx.arc(o.points[0].x, o.points[0].y, o.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = o.color;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      return;
    }

    if (o.mode === 'calligraphy') {
      for (let i = 1; i < o.points.length; i++) {
        const p0 = o.points[i - 1], p1 = o.points[i];
        ctx.lineWidth = strokeWidthAt(p0, p1, o.size);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    } else {
      ctx.lineWidth = o.size;
      ctx.beginPath();
      ctx.moveTo(o.points[0].x, o.points[0].y);
      for (let i = 1; i < o.points.length; i++) ctx.lineTo(o.points[i].x, o.points[i].y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function measureTextObj(ctx, o) {
    ctx.font = `${o.size}px ${o.font}`;
    const lines = o.text.split('\n');
    let w = 0;
    lines.forEach((l) => { w = Math.max(w, ctx.measureText(l).width); });
    const h = lines.length * o.size * 1.3;
    return { w, h, lines };
  }

  function drawTextObj(ctx, o) {
    ctx.fillStyle = o.color;
    ctx.font = `${o.size}px ${o.font}`;
    ctx.textBaseline = 'top';
    const lines = o.text.split('\n');
    lines.forEach((line, i) => ctx.fillText(line, o.x, o.y + i * o.size * 1.3));
  }

  function drawImageObj(ctx, o) {
    getImage(o.src, () => {});
    const cache = imgCacheRef.current;
    if (cache[o.src] && cache[o.src].complete) ctx.drawImage(cache[o.src], o.x, o.y, o.w, o.h);
  }

  function boundsOf(ctx, o) {
    if (o.type === 'image') return { x: o.x, y: o.y, w: o.w, h: o.h };
    if (o.type === 'text') { const m = measureTextObj(ctx, o); return { x: o.x, y: o.y, w: m.w, h: m.h }; }
    return null;
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = paperTone;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    if (paperStyle !== 'plain') drawPaperGuide(ctx, paperStyle);

    const inkLayer = inkLayerRef.current || document.createElement('canvas');
    inkLayerRef.current = inkLayer;
    inkLayer.width = LOGICAL_W * dpr;
    inkLayer.height = LOGICAL_H * dpr;
    const inkCtx = inkLayer.getContext('2d');
    inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    inkCtx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

    objectsRef.current.forEach((o) => {
      if (o.type === 'stroke') drawStrokeObj(inkCtx, o);
      else if (o.type === 'text') drawTextObj(inkCtx, o);
      else if (o.type === 'image') drawImageObj(inkCtx, o);
    });

    if (drawingRef.current && currentStrokeRef.current) drawStrokeObj(inkCtx, currentStrokeRef.current);
    ctx.drawImage(inkLayer, 0, 0, LOGICAL_W, LOGICAL_H);

    if (selectedRef.current) {
      const b = boundsOf(ctx, selectedRef.current);
      if (b) {
        ctx.save();
        ctx.strokeStyle = '#1F5F5B';
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
        ctx.restore();
      }
    }
  }

  function drawPaperGuide(ctx, style) {
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 100, 91, .10)';
    ctx.fillStyle = 'rgba(34, 100, 91, .14)';
    ctx.lineWidth = 1;
    if (style === 'ruled') {
      for (let y = 54; y < LOGICAL_H; y += 34) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(LOGICAL_W, y);
        ctx.stroke();
      }
    }
    if (style === 'dot') {
      for (let y = 28; y < LOGICAL_H; y += 26) {
        for (let x = 28; x < LOGICAL_W; x += 26) ctx.fillRect(x, y, 1.5, 1.5);
      }
    }
    ctx.restore();
  }

  function toCanvasCoords(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_W / rect.width;
    const scaleY = LOGICAL_H / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function hitTest(ctx, pt) {
    const objs = objectsRef.current;
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      if (o.type !== 'text' && o.type !== 'image') continue;
      const b = boundsOf(ctx, o);
      if (b && pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) return o;
    }
    return null;
  }

  function openEditor(pt) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const wrapRect = wrapRef.current.getBoundingClientRect();
    const cssX = rect.left - wrapRect.left + (pt.x / LOGICAL_W) * rect.width;
    const cssY = rect.top - wrapRect.top + (pt.y / LOGICAL_H) * rect.height;
    setEditor({ x: pt.x, y: pt.y, cssX, cssY });
  }

  function commitEditor(value) {
    if (editor && value.trim().length) {
      const { textFont, textColor, textSize } = propsRef.current;
      pushHistory();
      objectsRef.current.push({
        type: 'text', x: editor.x, y: editor.y, text: value,
        font: textFont, size: textSize, color: textColor
      });
      redraw();
    }
    setEditor(null);
  }

  function handlePointerDown(e) {
    const canvas = canvasRef.current;
    canvas.setPointerCapture(e.pointerId);
    const pt = toCanvasCoords(e);
    const { tool: t, penColor: pc, penSize: ps, eraserSize: es } = propsRef.current;

    if (t === 'pen' || t === 'calligraphy' || t === 'eraser') {
      pushHistory();
      drawingRef.current = true;
      currentStrokeRef.current = {
        type: 'stroke',
        mode: t === 'eraser' ? 'erase' : (t === 'calligraphy' ? 'calligraphy' : 'pen'),
        color: pc,
        size: t === 'eraser' ? es : ps,
        points: [pt]
      };
    } else if (t === 'text') {
      openEditor(pt);
    } else if (t === 'select') {
      const ctx = getCtx();
      const hit = hitTest(ctx, pt);
      selectedRef.current = hit;
      if (hit) { pushHistory(); draggingRef.current = { obj: hit, offX: pt.x - hit.x, offY: pt.y - hit.y }; }
      redraw();
    }
  }

  function handlePointerMove(e) {
    if (!drawingRef.current && !draggingRef.current) return;
    const pt = toCanvasCoords(e);
    if (drawingRef.current && currentStrokeRef.current) {
      currentStrokeRef.current.points.push(pt);
      redraw();
    } else if (draggingRef.current) {
      draggingRef.current.obj.x = pt.x - draggingRef.current.offX;
      draggingRef.current.obj.y = pt.y - draggingRef.current.offY;
      redraw();
    }
  }

  function endStroke() {
    if (drawingRef.current && currentStrokeRef.current) {
      objectsRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = null;
      drawingRef.current = false;
      redraw();
    }
    draggingRef.current = null;
  }

  function insertImageFile(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      const im = new Image();
      im.onload = () => {
        imgCacheRef.current[src] = im;
        const maxDim = 320;
        let w = im.width, h = im.height;
        const ratio = Math.min(maxDim / w, maxDim / h, 1);
        w *= ratio; h *= ratio;
        pushHistory();
        const obj = { type: 'image', src, x: (LOGICAL_W - w) / 2, y: (LOGICAL_H - h) / 2, w, h };
        objectsRef.current.push(obj);
        selectedRef.current = obj;
        redraw();
        if (onAfterImageInsert) onAfterImageInsert();
      };
      im.src = src;
    };
    reader.readAsDataURL(file);
  }

  function flattenedPNG() {
    const tmp = selectedRef.current;
    selectedRef.current = null;
    redraw();
    const data = canvasRef.current.toDataURL('image/png');
    selectedRef.current = tmp;
    redraw();
    return data;
  }

  function getTextNotes() {
    return objectsRef.current.filter((o) => o.type === 'text').map((o) => o.text);
  }

  useImperativeHandle(ref, () => ({
    undo,
    redo,
    clear: clearAll,
    insertImage: insertImageFile,
    getPNG: flattenedPNG,
    getTextNotes,
    getLogicalSize: () => ({ w: LOGICAL_W, h: LOGICAL_H }),
    hasContent: () => objectsRef.current.length > 0
  }));

  const cursorClass = tool === 'select' ? 'tool-select' : tool === 'text' ? 'tool-text' : '';

  return (
    <div className="page-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className={`board ${cursorClass}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
      />
      {editor && (
        <TextEditorOverlay
          x={editor.cssX}
          y={editor.cssY}
          font={textFont}
          onAdd={commitEditor}
          onCancel={() => setEditor(null)}
        />
      )}
    </div>
  );
});

export default CanvasBoard;
