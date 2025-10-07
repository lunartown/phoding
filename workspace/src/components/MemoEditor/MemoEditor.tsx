import { useState } from 'react';
import { Memo, MemoColor } from '../../types/memo';
import './MemoEditor.css';

interface MemoEditorProps {
  memo: Memo;
  onSave: (memo: Memo) => void;
  onCancel: () => void;
}

export function MemoEditor({ memo, onSave, onCancel }: MemoEditorProps) {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content);
  const [color, setColor] = useState<MemoColor>(memo.color || 'yellow');

  const handleSave = () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    onSave({
      ...memo,
      title: title.trim(),
      content: content.trim(),
      color,
    });
  };

  const colors: MemoColor[] = ['yellow', 'green', 'blue', 'pink', 'purple'];

  return (
    <div className="memo-editor">
      <div className="editor-header">
        <input
          type="text"
          className="editor-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="메모 제목"
          autoFocus
        />
        <div className="editor-actions">
          <button className="btn btn-cancel" onClick={onCancel}>
            취소
          </button>
          <button className="btn btn-save" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
      <div className="color-picker">
        <span>색상:</span>
        {colors.map(c => (
          <button
            key={c}
            className={`color-option color-${c} ${color === c ? 'selected' : ''}`}
            onClick={() => setColor(c)}
            title={c}
          />
        ))}
      </div>
      <textarea
        className="editor-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="메모 내용을 입력하세요..."
      />
    </div>
  );
}
