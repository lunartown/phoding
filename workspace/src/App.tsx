import { useState } from 'react'
import './App.css'

interface Note {
  id: number
  title: string
  content: string
  createdAt: Date
}

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const handleCreateNote = () => {
    if (!title.trim()) return

    const newNote: Note = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date()
    }

    setNotes([newNote, ...notes])
    setTitle('')
    setContent('')
    setIsEditing(false)
  }

  const handleUpdateNote = () => {
    if (!currentNote || !title.trim()) return

    const updatedNotes = notes.map(note =>
      note.id === currentNote.id
        ? { ...note, title: title.trim(), content: content.trim() }
        : note
    )

    setNotes(updatedNotes)
    setCurrentNote(null)
    setTitle('')
    setContent('')
    setIsEditing(false)
  }

  const handleEditNote = (note: Note) => {
    setCurrentNote(note)
    setTitle(note.title)
    setContent(note.content)
    setIsEditing(true)
  }

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id))
    if (currentNote?.id === id) {
      setCurrentNote(null)
      setTitle('')
      setContent('')
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setCurrentNote(null)
    setTitle('')
    setContent('')
    setIsEditing(false)
  }

  const handleNewNote = () => {
    setCurrentNote(null)
    setTitle('')
    setContent('')
    setIsEditing(true)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📝 메모장</h1>
      </header>

      <div className="container">
        <div className="sidebar">
          <button className="new-note-btn" onClick={handleNewNote}>
            + 새 메모
          </button>
          <div className="notes-list">
            {notes.length === 0 ? (
              <p className="empty-message">메모가 없습니다</p>
            ) : (
              notes.map(note => (
                <div
                  key={note.id}
                  className={`note-item ${currentNote?.id === note.id ? 'active' : ''}`}
                  onClick={() => handleEditNote(note)}
                >
                  <h3>{note.title}</h3>
                  <p>{note.content.substring(0, 50)}{note.content.length > 50 ? '...' : ''}</p>
                  <small>{new Date(note.createdAt).toLocaleString('ko-KR')}</small>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteNote(note.id)
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="editor">
          {isEditing ? (
            <>
              <input
                type="text"
                className="title-input"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="content-input"
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="button-group">
                <button className="save-btn" onClick={currentNote ? handleUpdateNote : handleCreateNote}>
                  {currentNote ? '수정' : '저장'}
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  취소
                </button>
              </div>
            </>
          ) : (
            <div className="empty-editor">
              <p>메모를 선택하거나 새 메모를 작성하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App