import React from 'react';

export const PALETTE = ['#1c1c1c', '#1F5F5B', '#A3453A', '#2255A4', '#8A5A2B', '#6B3FA0', '#B8862E', '#3C7A3E'];

const TOOLS = [
  { id: 'pen', icon: '✎', label: 'Pen', hint: 'Freehand ink' },
  { id: 'calligraphy', icon: '✒', label: 'Calligraphy', hint: 'Variable stroke' },
  { id: 'eraser', icon: '⌫', label: 'Eraser', hint: 'Remove marks' },
  { id: 'text', icon: 'T', label: 'Text', hint: 'Add a note' },
  { id: 'select', icon: '↕', label: 'Move', hint: 'Select objects' }
];

export default function Toolbar({
  tool, setTool,
  penColor, setPenColor,
  penSize, setPenSize,
  eraserSize, setEraserSize,
  textColor, setTextColor,
  textFont, setTextFont,
  textSize, setTextSize,
  paperStyle, setPaperStyle,
  onInsertImageFile,
  onUndo, onRedo, onClear
}) {
  const showPenPanel = tool === 'pen' || tool === 'calligraphy' || tool === 'eraser';
  const showTextPanel = tool === 'text';

  return (
    <div className="toolbar">
      <div className="toolbar-intro">
        <span className="eyebrow">Your toolkit</span>
        <p>Make the page yours.</p>
      </div>

      <div className="tool-group tool-list">
        <div className="group-heading"><h3>Tools</h3><span>01</span></div>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tool-btn ${tool === t.id ? 'active' : ''}`}
            onClick={() => setTool(t.id)}
            title={`${t.label} — ${t.hint}`}
          >
            <span className="tool-glyph">{t.icon}</span>
            <span className="tool-copy"><strong>{t.label}</strong><small>{t.hint}</small></span>
            {tool === t.id && <span className="active-mark" aria-hidden="true">●</span>}
          </button>
        ))}
      </div>

      <div className="tool-group insert-group">
        <div className="group-heading"><h3>Bring in</h3><span>02</span></div>
        <label className="file-btn" htmlFor="imgInput">🖼️ Insert image</label>
        <input
          id="imgInput"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) onInsertImageFile(file);
            e.target.value = '';
          }}
        />
      </div>

      <div className="tool-group history-group">
        <div className="group-heading"><h3>History</h3><span>03</span></div>
        <div className="history-actions">
          <button type="button" className="mini-action" onClick={onUndo} title="Undo (Ctrl/Cmd + Z)"><span>↶</span>Undo</button>
          <button type="button" className="mini-action" onClick={onRedo} title="Redo (Ctrl/Cmd + Y)"><span>↷</span>Redo</button>
        </div>
        <button type="button" className="clear-btn" onClick={onClear}><span>×</span> Clear page</button>
      </div>

      <div className="tool-group surface-group">
        <div className="group-heading"><h3>Page surface</h3><span>04</span></div>
        <div className="surface-options" role="group" aria-label="Page surface">
          {[
            ['plain', 'Blank', 'Clean paper'],
            ['ruled', 'Ruled', 'Writing lines'],
            ['dot', 'Dotted', 'Quiet structure']
          ].map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              className={`surface-option ${paperStyle === value ? 'active' : ''} surface-${value}`}
              onClick={() => setPaperStyle(value)}
              title={hint}
            >
              <span className="surface-preview" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {showPenPanel && (
        <div className="context-panel">
          <div>
            {tool === 'eraser' ? (
              <div className="eraser-preview"><span style={{ width: `${Math.min(48, eraserSize)}px`, height: `${Math.min(48, eraserSize)}px` }} /></div>
            ) : (
              <>
                <div className="control-label"><label>Ink colour</label><span>{penSize}px</span></div>
                <div className="swatches">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Use ${c} ink`}
                      className={`swatch ${penColor === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setPenColor(c)}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  aria-label="Choose custom ink colour"
                />
              </>
            )}
          </div>
          <div>
            <div className="control-label"><label>{tool === 'eraser' ? 'Eraser size' : 'Thickness'}</label><span>{tool === 'eraser' ? `${eraserSize}px` : `${penSize}px`}</span></div>
            <input
              type="range" min={tool === 'eraser' ? 8 : 1} max={tool === 'eraser' ? 120 : 40}
              value={tool === 'eraser' ? eraserSize : penSize}
              onChange={(e) => tool === 'eraser' ? setEraserSize(+e.target.value) : setPenSize(+e.target.value)}
              aria-label={tool === 'eraser' ? 'Eraser size' : 'Pen thickness'}
            />
          </div>
        </div>
      )}

      {showTextPanel && (
        <div className="context-panel">
          <div>
            <div className="control-label"><label>Writing style</label><span>Text</span></div>
            <select value={textFont} onChange={(e) => setTextFont(e.target.value)}>
              <option value="'Work Sans', sans-serif">Plain — Work Sans</option>
              <option value="'Courier Prime', monospace">Typewriter — Courier</option>
              <option value="'Caveat', cursive">Own handwriting — Caveat</option>
              <option value="'Shadows Into Light', cursive">Casual script</option>
              <option value="'Dancing Script', cursive">Flowing script</option>
              <option value="'Great Vibes', cursive">Calligraphy — formal</option>
              <option value="'Sacramento', cursive">Calligraphy — signature</option>
            </select>
          </div>
          <div>
            <div className="control-label"><label>Text colour</label><span>Custom</span></div>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} aria-label="Choose text colour" />
          </div>
          <div>
            <div className="control-label"><label>Size</label><span>{textSize}px</span></div>
            <input
              type="range" min="12" max="72" value={textSize}
              onChange={(e) => setTextSize(+e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
