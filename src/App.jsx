import React, { useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import CanvasBoard from './components/CanvasBoard.jsx';
import { exportPdf, exportTxt, exportDocx } from './utils/exporters.js';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [pageTitle, setPageTitle] = useState('Untitled study');
  const [paperStyle, setPaperStyle] = useState('plain');
  const [focusMode, setFocusMode] = useState(false);
  const [tool, setTool] = useState('pen');
  const [penColor, setPenColor] = useState('#1c1c1c');
  const [penSize, setPenSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(28);
  const [textColor, setTextColor] = useState('#1c1c1c');
  const [textFont, setTextFont] = useState("'Caveat', cursive");
  const [textSize, setTextSize] = useState(26);
  const [menuOpen, setMenuOpen] = useState(false);

  const boardRef = useRef(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  useEffect(() => {
    function handleShortcut(event) {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) boardRef.current?.redo();
        else boardRef.current?.undo();
      }
      if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        boardRef.current?.redo();
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  function handleInsertImageFile(file) {
    boardRef.current?.insertImage(file);
  }

  function handleAfterImageInsert() {
    setTool('select');
  }

  function handleDownload(kind) {
    const board = boardRef.current;
    if (!board) return;
    const png = board.getPNG();
    const notes = board.getTextNotes();
    const size = board.getLogicalSize();

    if (kind === 'pdf') exportPdf(png, size);
    else if (kind === 'txt') exportTxt(notes);
    else if (kind === 'docx') exportDocx(png, notes, size);

    setMenuOpen(false);
  }

  return (
    <div className={`app ${focusMode ? 'focus-mode' : ''}`}>
      <div className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">i</div>
          <div className="brand">
            <div className="brand-kicker">A quiet place to make</div>
            <h1>Inkwell</h1>
          </div>
          <span className="save-status"><span className="status-dot" /> Local canvas</span>
        </div>
        <div className="topbar-actions">
          <span className="shortcut-note">Undo <kbd>⌘ Z</kbd></span>
          <button type="button" className="focus-toggle" onClick={() => setFocusMode((value) => !value)}>
            <span aria-hidden="true">{focusMode ? '↙' : '↗'}</span> {focusMode ? 'Exit focus' : 'Focus canvas'}
          </button>
          <button
            type="button"
            className="theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          >
            <span className="theme-icon" aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span>
            <span>{theme === 'dark' ? 'Daylight' : 'Night mode'}</span>
          </button>
        </div>
      </div>

      <div className="workspace">
        <Toolbar
          tool={tool} setTool={setTool}
          penColor={penColor} setPenColor={setPenColor}
          penSize={penSize} setPenSize={setPenSize}
          eraserSize={eraserSize} setEraserSize={setEraserSize}
          textColor={textColor} setTextColor={setTextColor}
          textFont={textFont} setTextFont={setTextFont}
          textSize={textSize} setTextSize={setTextSize}
          paperStyle={paperStyle} setPaperStyle={setPaperStyle}
          onInsertImageFile={handleInsertImageFile}
          onUndo={() => boardRef.current?.undo()}
          onRedo={() => boardRef.current?.redo()}
          onClear={() => {
            if (boardRef.current?.hasContent() && window.confirm('Clear the whole page? This cannot be undone once you continue drawing.')) {
              boardRef.current.clear();
            }
          }}
        />

        <main className="canvas-area">
          <div className="canvas-heading">
            <div>
              <span className="section-kicker">Today&apos;s page</span>
              <input
                className="page-title"
                value={pageTitle}
                onChange={(event) => setPageTitle(event.target.value)}
                aria-label="Page title"
              />
            </div>
            <div className="page-meta">
              <span className="paper-chip">A4 portrait</span>
              <span>Private by default</span>
            </div>
          </div>

          <CanvasBoard
            ref={boardRef}
            tool={tool}
            penColor={penColor}
            penSize={penSize}
            eraserSize={eraserSize}
            textColor={textColor}
            textFont={textFont}
            textSize={textSize}
            paperTone={theme === 'dark' ? '#f5f1e7' : '#fffdf7'}
            paperStyle={paperStyle}
            onAfterImageInsert={handleAfterImageInsert}
          />

          <div className="actions-row">
            <div className="canvas-tip"><span className="tip-icon">+</span> Choose a tool, then make a mark</div>
            <div className="download-wrap">
              <button
                type="button"
                className="pill-btn primary"
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              >
                ⬇ Download
              </button>
              <div className={`download-menu ${menuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => handleDownload('pdf')}>📄 Download as PDF</button>
                <button type="button" onClick={() => handleDownload('docx')}>📝 Download as DOCX</button>
                <button type="button" onClick={() => handleDownload('txt')}>🔤 Download as TXT</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer>
        <span>Inkwell studio</span>
        <span>Made for notes, sketches &amp; half-formed ideas</span>
        <span className="credit">Designed &amp; developed by <b>Aditya</b> <i>·</i> 2026</span>
      </footer>
    </div>
  );
}
