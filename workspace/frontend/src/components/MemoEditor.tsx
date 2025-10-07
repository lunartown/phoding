import { useState, useEffect } from 'react'
import { Memo } from '../types'
import './MemoEditor.css'

interface MemoEditorProps {
  memo: Memo
  onUpdate: (id: string, title: string, content: string) => void
}

function MemoEditor({ memo, onUpdate }: MemoEditorProps) {
  const [title, setTitle] = useState(memo.title)
  const [content, setContent] = useState(memo.content)

  useEffect(() => {
    setTitle(memo.title)
    setContent(memo.content)
  }, [memo.id])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    onUpdate(memo.id, newTitle, content)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    onUpdate(memo.id, title, newContent)
  }

  return (
    <div className="memo-editor">
      <input 
        type="text"
        className="memo-title-input"
        value={title}
        onChange={handleTitleChange}
        placeholder="제목을 입력하세요"
      />
      <textarea 
        className="memo-content-input"
        value={content}
        onChange={handleContentChange}
        placeholder="내용을 입력하세요..."
      />
    </div>
  )
}

export default MemoEditor