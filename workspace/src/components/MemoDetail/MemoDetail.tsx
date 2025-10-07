import { Memo } from '../../types/memo';
import './MemoDetail.css';

interface MemoDetailProps {
  memo: Memo;
  onEdit: () => void;
  onDelete: () => void;
}

export function MemoDetail({ memo, onEdit, onDelete }: MemoDetailProps) {
  const handleDelete = () => {
    if (window.confirm('이 메모를 삭제하시겠습니까?')) {
      onDelete();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`memo-detail color-${memo.color}`}>
      <div className="detail-header">
        <h2 className="detail-title">{memo.title}</h2>
        <div className="detail-actions">
          <button className="btn btn-edit" onClick={onEdit}>
            ✏️ 수정
          </button>
          <button className="btn btn-delete" onClick={handleDelete}>
            🗑️ 삭제
          </button>
        </div>
      </div>
      <div className="detail-meta">
        <div>
          <span className="meta-label">작성:</span>
          <span className="meta-value">{formatDate(memo.createdAt)}</span>
        </div>
        <div>
          <span className="meta-label">수정:</span>
          <span className="meta-value">{formatDate(memo.updatedAt)}</span>
        </div>
      </div>
      <div className="detail-content">
        {memo.content ? (
          <pre className="content-text">{memo.content}</pre>
        ) : (
          <p className="no-content">내용이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
