import { useState, useEffect } from 'react';
import { MemoList } from './MemoList';
import { MemoEditor } from './MemoEditor';
import { Memo } from './types';
import './MemoApp.css';

export function MemoApp() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('fontSize');
    return saved ? parseInt(saved) : 16;
  });

  useEffect(() => {
    const savedMemos = localStorage.getItem('memos');
    if (savedMemos) {
      setMemos(JSON.parse(savedMemos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('memos', JSON.stringify(memos));
  }, [memos]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  const selectedMemo = memos.find(memo => memo.id === selectedMemoId);

  const filteredMemos = memos.filter(memo =>
    memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memo.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateMemo = () => {
    const newMemo: Memo = {
      id: Date.now().toString(),
      title: '새 메모',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMemos([newMemo, ...memos]);
    setSelectedMemoId(newMemo.id);
  };

  const handleUpdateMemo = (id: string, title: string, content: string) => {
    setMemos(memos.map(memo =>
      memo.id === id
        ? { ...memo, title, content, updatedAt: new Date().toISOString() }
        : memo
    ));
  };

  const handleDeleteMemo = (id: string) => {
    setMemos(memos.filter(memo => memo.id !== id));
    if (selectedMemoId === id) {
      setSelectedMemoId(null);
    }
  };

  const handleIncreaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 32));
  };

  const handleDecreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const handleResetFontSize = () => {
    setFontSize(16);
  };

  return (
    <div className="memo-app">
      <div className="memo-sidebar">
        <div className="memo-sidebar-header">
          <h1>메모</h1>
          <button onClick={handleCreateMemo} className="btn-create">
            + 새 메모
          </button>
        </div>
        <div className="memo-search">
          <input
            type="text"
            placeholder="메모 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <MemoList
          memos={filteredMemos}
          selectedMemoId={selectedMemoId}
          onSelectMemo={setSelectedMemoId}
          onDeleteMemo={handleDeleteMemo}
        />
      </div>
      <div className="memo-content">
        {selectedMemo ? (
          <MemoEditor
            memo={selectedMemo}
            onUpdateMemo={handleUpdateMemo}
            fontSize={fontSize}
            onIncreaseFontSize={handleIncreaseFontSize}
            onDecreaseFontSize={handleDecreaseFontSize}
            onResetFontSize={handleResetFontSize}
          />
        ) : (
          <div className="memo-empty">
            <p>메모를 선택하거나 새로 만들어보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}