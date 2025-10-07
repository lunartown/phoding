import { Memo } from '../types'
import './MemoList.css'

interface MemoListProps {
  memos: Memo[]
  selectedMemo: Memo | null
  onSelectMemo: (memo: Memo) => void
  onDeleteMemo: (id: string) => void
}

function MemoList({ memos, selectedMemo, onSelectMemo, onDeleteMemo }: MemoListProps) {
  const formatDate = (date: Date) => {
    const now = new Date()
    const memoDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - memoDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return memoDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '어제'
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      return memoDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="memo-list">
      {memos.map(memo => (
        <div 
          key={memo.id}
          className={`memo-item ${selectedMemo?.id === memo.id ? 'active' : ''}`}
          onClick={() => onSelectMemo(memo)}
        >
          <div className="memo-item-header">
            <h3>{memo.title || '제목 없음'}</h3>
            <button 
              className="btn-delete"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteMemo(memo.id)
              }}
            >
              ✕
            </button>
          </div>
          <p className="memo-preview">{memo.content || '내용 없음'}</p>
          <span className="memo-date">{formatDate(memo.updatedAt)}</span>
        </div>
      ))}
    </div>
  )
}

export default MemoList