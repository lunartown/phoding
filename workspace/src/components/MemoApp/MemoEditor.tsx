import { useState, useEffect } from 'react';
import { Memo } from './types';

interface MemoEditorProps {
  memo: Memo;
  onUpdateMemo: (id: string, title: string, content: string) => void;
  fontSize: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
}

export function MemoEditor({ 
  memo, 
  onUpdateMemo, 
  fontSize,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize
}: MemoEditorProps) {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content);

  useEffect(() => {
    setTitle(memo.title);
    setContent(memo.content);
  }, [memo.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onUpdateMemo(memo.id, newTitle, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onUpdateMemo(memo.id, title, newContent);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="memo-editor">
      <div className="memo-editor-header">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="memo-editor-title"
          placeholder="제목 없음"
        />
        <div className="memo-editor-info">
          <span className="memo-editor-date">
            수정: {formatDate(memo.updatedAt)}
          </span>
          <div className="font-size-controls">
            <button 
              onClick={onDecreaseFontSize}
              className="btn-font-size"
              title="글자 크기 줄이기"
              disabled={fontSize <= 12}
            >
              A−
            </button>
            <span className="font-size-value">{fontSize}px</span>
            <button 
              onClick={onResetFontSize}
              className="btn-font-size"
              title="기본 크기로"
            >
              A
            </button>
            <button 
              onClick={onIncreaseFontSize}
              className="btn-font-size"
              title="글자 크기 키우기"
              disabled={fontSize >= 32}
            >
              A+
            </button>
          </div>
        </div>
      </div>
      <textarea
        value={content}
        onChange={handleContentChange}
        className="memo-editor-content"
        placeholder="메모를 입력하세요..."
        style={{ fontSize: `${fontSize}px` }}
      />
    </div>
  );
}