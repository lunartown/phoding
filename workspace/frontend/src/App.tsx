import { useState } from 'react'
import MemoList from './components/MemoList'
import MemoEditor from './components/MemoEditor'
import { Memo } from './types'
import './App.css'

function App() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)

  const addMemo = () => {
    const newMemo: Memo = {
      id: Date.now().toString(),
      title: '새 메모',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setMemos([newMemo, ...memos])
    setSelectedMemo(newMemo)
  }

  const updateMemo = (id: string, title: string, content: string) => {
    setMemos(memos.map(memo => 
      memo.id === id 
        ? { ...memo, title, content, updatedAt: new Date() }
        : memo
    ))
    if (selectedMemo?.id === id) {
      setSelectedMemo({ ...selectedMemo, title, content, updatedAt: new Date() })
    }
  }

  const deleteMemo = (id: string) => {
    setMemos(memos.filter(memo => memo.id !== id))
    if (selectedMemo?.id === id) {
      setSelectedMemo(null)
    }
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>메모</h1>
          <button onClick={addMemo} className="btn-add">+ 새 메모</button>
        </div>
        <MemoList 
          memos={memos} 
          selectedMemo={selectedMemo}
          onSelectMemo={setSelectedMemo}
          onDeleteMemo={deleteMemo}
        />
      </div>
      <div className="main-content">
        {selectedMemo ? (
          <MemoEditor 
            memo={selectedMemo}
            onUpdate={updateMemo}
          />
        ) : (
          <div className="empty-state">
            <p>메모를 선택하거나 새로 만들어보세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App