'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Image,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Minus,
  Highlighter,
  Palette,
  Eraser,
  Superscript,
  Subscript,
  Indent,
  Outdent,
  X,
  Type,
  Box,
  MapPin,
  WrapText,
  Eye,
  Edit3,
} from 'lucide-react';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
  /** When set, shown on the left of the first row with Edit/Preview/HTML on the right */
  label?: string;
}

type DialogType = 'link' | 'image' | 'foreColor' | 'backColor' | null;
type ViewMode = 'edit' | 'preview' | 'html';

export function RichTextEditor({ value, onChange, placeholder, minHeight = 160, className = '', label }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [dialogValue, setDialogValue] = useState('');
  const [dialogColor, setDialogColor] = useState('#3b82f6');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalChange.current = true;
    onChange(el.innerHTML);
  }, [onChange]);

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const openDialog = useCallback((type: DialogType, initial = '') => {
    setDialog(type);
    if (type === 'link' || type === 'image') {
      setDialogValue(initial || 'https://');
    } else if (type === 'foreColor' || type === 'backColor') {
      setDialogValue(initial || '#3b82f6');
      setDialogColor(initial || '#3b82f6');
    }
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
    setDialogValue('');
  }, []);

  const submitLink = useCallback(() => {
    const url = dialogValue.trim();
    if (url) exec('createLink', url);
    closeDialog();
  }, [dialogValue, exec, closeDialog]);

  const submitImage = useCallback(() => {
    const url = dialogValue.trim();
    if (url) {
      document.execCommand('insertHTML', false, `<img src="${url}" alt="" style="max-width:100%;height:auto;" />`);
      editorRef.current?.focus();
      handleInput();
    }
    closeDialog();
  }, [dialogValue, handleInput, closeDialog]);

  const submitColor = useCallback(() => {
    const color = (dialogValue.trim() || dialogColor || '#3b82f6').trim();
    if (color && (dialog === 'foreColor' || dialog === 'backColor')) {
      document.execCommand(dialog, false, color);
      editorRef.current?.focus();
      handleInput();
    }
    closeDialog();
  }, [dialog, dialogColor, dialogValue, handleInput, closeDialog]);

  const formatBlock = useCallback(
    (tag: string) => {
      document.execCommand('formatBlock', false, tag);
      editorRef.current?.focus();
      handleInput();
    },
    [handleInput]
  );

  const openColorDialog = useCallback((type: 'foreColor' | 'backColor') => openDialog(type), [openDialog]);

  const insertHR = useCallback(() => {
    document.execCommand('insertHorizontalRule', false);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const wrapSpan = useCallback(() => {
    const sel = window.getSelection();
    const el = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !el) return;
    const anchor = sel.anchorNode && el.contains(sel.anchorNode);
    if (!anchor) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      document.execCommand('insertHTML', false, '<span></span>');
    } else {
      const span = document.createElement('span');
      try {
        range.surroundContents(span);
      } catch {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }
    }
    el.focus();
    handleInput();
  }, [handleInput]);

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    border: 'none',
    background: 'transparent',
    borderRadius: 4,
    cursor: 'pointer',
    color: '#475569',
  };

  const viewBtnStyle = (active: boolean): React.CSSProperties => ({
    ...btnStyle,
    padding: '6px 12px',
    width: 'auto',
    gap: 6,
    fontSize: 13,
    background: active ? '#e0e7ff' : 'transparent',
    color: active ? '#3730a3' : '#475569',
  });

  const viewSwitcher = (
    <div style={{ display: 'flex', gap: 2 }} onMouseDown={(e) => e.preventDefault()}>
      <button type="button" onClick={() => setViewMode('edit')} title="Edit" style={viewBtnStyle(viewMode === 'edit')}>
        <Edit3 size={16} />
        <span>Edit</span>
      </button>
      <button type="button" onClick={() => setViewMode('preview')} title="Preview" style={viewBtnStyle(viewMode === 'preview')}>
        <Eye size={16} />
        <span>Preview</span>
      </button>
      <button type="button" onClick={() => setViewMode('html')} title="HTML" style={viewBtnStyle(viewMode === 'html')}>
        <Code size={16} />
        <span>HTML</span>
      </button>
    </div>
  );

  return (
    <div className={`rich-text-editor ${className}`} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
      {label != null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <span className="form-label" style={{ margin: 0 }}>{label}</span>
          {viewSwitcher}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {label == null && (
          <>
            {viewSwitcher}
            <span style={{ width: 1, height: 24, background: '#e2e8f0' }} />
          </>
        )}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
        <button type="button" onClick={() => exec('bold')} title="Bold" style={btnStyle}>
          <Bold size={18} />
        </button>
        <button type="button" onClick={() => exec('italic')} title="Italic" style={btnStyle}>
          <Italic size={18} />
        </button>
        <button type="button" onClick={() => exec('underline')} title="Underline" style={btnStyle}>
          <Underline size={18} />
        </button>
        <button type="button" onClick={() => exec('strikeThrough')} title="Strikethrough" style={btnStyle}>
          <Strikethrough size={18} />
        </button>
        <button type="button" onClick={() => exec('subscript')} title="Subscript" style={btnStyle}>
          <Subscript size={18} />
        </button>
        <button type="button" onClick={() => exec('superscript')} title="Superscript" style={btnStyle}>
          <Superscript size={18} />
        </button>
        <span style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        <button type="button" onClick={() => formatBlock('p')} title="Paragraph" style={btnStyle}>
          <Type size={18} />
        </button>
        <button type="button" onClick={() => formatBlock('div')} title="Div" style={btnStyle}>
          <Box size={18} />
        </button>
        <button type="button" onClick={wrapSpan} title="Span (wrap selection)" style={btnStyle}>
          <WrapText size={18} />
        </button>
        <span style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        <button type="button" onClick={() => formatBlock('h1')} title="Heading 1" style={btnStyle}>
          <Heading1 size={18} />
        </button>
        <button type="button" onClick={() => formatBlock('h2')} title="Heading 2" style={btnStyle}>
          <Heading2 size={18} />
        </button>
        <button type="button" onClick={() => formatBlock('h3')} title="Heading 3" style={btnStyle}>
          <Heading3 size={18} />
        </button>
        <button type="button" onClick={() => formatBlock('h4')} title="Heading 4" style={btnStyle}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>H4</span>
        </button>
        <button type="button" onClick={() => formatBlock('h5')} title="Heading 5" style={btnStyle}>
          <span style={{ fontSize: 11, fontWeight: 700 }}>H5</span>
        </button>
        <button type="button" onClick={() => formatBlock('h6')} title="Heading 6" style={btnStyle}>
          <span style={{ fontSize: 10, fontWeight: 700 }}>H6</span>
        </button>
        <button type="button" onClick={() => formatBlock('blockquote')} title="Blockquote" style={btnStyle}>
          <Quote size={18} />
        </button>
        <button type="button" onClick={() => formatBlock('pre')} title="Code block" style={btnStyle}>
          <Code size={18} />
        </button>
        <button type="button" onClick={() => formatBlock('address')} title="Address" style={btnStyle}>
          <MapPin size={18} />
        </button>
        <span style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        <button type="button" onClick={() => openDialog('link')} title="Insert link" style={btnStyle}>
          <Link size={18} />
        </button>
        <button type="button" onClick={() => openDialog('image')} title="Insert image" style={btnStyle}>
          <Image size={18} />
        </button>
        <button type="button" onClick={insertHR} title="Horizontal rule" style={btnStyle}>
          <Minus size={18} />
        </button>
        <span style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        <button type="button" onClick={() => openColorDialog('foreColor')} title="Text color" style={btnStyle}>
          <Palette size={18} />
        </button>
        <button type="button" onClick={() => openColorDialog('backColor')} title="Highlight color" style={btnStyle}>
          <Highlighter size={18} />
        </button>
        <span style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        <button type="button" onClick={() => exec('insertUnorderedList')} title="Bullet list" style={btnStyle}>
          <List size={18} />
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} title="Numbered list" style={btnStyle}>
          <ListOrdered size={18} />
        </button>
        <button type="button" onClick={() => exec('outdent')} title="Decrease indent" style={btnStyle}>
          <Outdent size={18} />
        </button>
        <button type="button" onClick={() => exec('indent')} title="Increase indent" style={btnStyle}>
          <Indent size={18} />
        </button>
        <span style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        <button type="button" onClick={() => exec('justifyLeft')} title="Align left" style={btnStyle}>
          <AlignLeft size={18} />
        </button>
        <button type="button" onClick={() => exec('justifyCenter')} title="Align center" style={btnStyle}>
          <AlignCenter size={18} />
        </button>
        <button type="button" onClick={() => exec('justifyRight')} title="Align right" style={btnStyle}>
          <AlignRight size={18} />
        </button>
        <button type="button" onClick={() => exec('justifyFull')} title="Justify" style={btnStyle}>
          <AlignJustify size={18} />
        </button>
        <span style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        <button type="button" onClick={() => exec('removeFormat')} title="Clear formatting" style={btnStyle}>
          <Eraser size={18} />
        </button>
        </div>
      </div>

      {viewMode === 'edit' && (
        <div
          ref={editorRef}
          contentEditable
          data-placeholder={placeholder}
          onInput={handleInput}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
            document.execCommand('insertHTML', false, text);
            handleInput();
          }}
          style={{
            minHeight,
            padding: 12,
            outline: 'none',
            overflowY: 'auto',
            background: '#fff',
            fontSize: 14,
            lineHeight: 1.5,
          }}
          suppressContentEditableWarning
        />
      )}

      {viewMode === 'preview' && (
        <div
          className="rich-text-editor-preview"
          style={{
            minHeight,
            padding: 12,
            overflowY: 'auto',
            background: '#f8fafc',
            fontSize: 14,
            lineHeight: 1.5,
            borderTop: '1px solid #e2e8f0',
          }}
          dangerouslySetInnerHTML={{ __html: value || '<span style="color:#94a3b8">Nothing to preview</span>' }}
        />
      )}

      {viewMode === 'html' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{
            minHeight,
            width: '100%',
            padding: 12,
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 13,
            lineHeight: 1.5,
            background: '#1e293b',
            color: '#e2e8f0',
          }}
          placeholder="<p>Enter HTML...</p>"
        />
      )}

      {dialog && (
        <div
          className="modal-overlay"
          style={{ zIndex: 10000 }}
          onClick={closeDialog}
        >
          <div
            className="modal-content organization-modal"
            style={{ maxWidth: 400, padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
                {dialog === 'link' && 'Insert link'}
                {dialog === 'image' && 'Insert image'}
                {dialog === 'foreColor' && 'Text color'}
                {dialog === 'backColor' && 'Highlight color'}
              </h2>
              <button
                type="button"
                onClick={closeDialog}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {(dialog === 'link' || dialog === 'image') && (
                <>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
                    {dialog === 'link' ? 'URL' : 'Image URL'}
                  </label>
                  <input
                    type="url"
                    value={dialogValue}
                    onChange={(e) => setDialogValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (dialog === 'link' ? submitLink() : submitImage())}
                    className="form-input"
                    placeholder="https://"
                    autoFocus
                    style={{ width: '100%', marginBottom: 16 }}
                  />
                </>
              )}
              {(dialog === 'foreColor' || dialog === 'backColor') && (
                <>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Color</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                    <input
                      type="color"
                      value={dialogColor}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDialogColor(v);
                        setDialogValue(v);
                      }}
                      style={{ width: 48, height: 40, border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', padding: 2 }}
                    />
                    <input
                      type="text"
                      value={dialogValue}
                      onChange={(e) => setDialogValue(e.target.value)}
                      className="form-input"
                      placeholder="#3b82f6"
                      style={{ flex: 1 }}
                    />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={closeDialog}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => {
                    if (dialog === 'link') submitLink();
                    else if (dialog === 'image') submitImage();
                    else if (dialog === 'foreColor' || dialog === 'backColor') submitColor();
                  }}
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
