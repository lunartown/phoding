import { Memo } from '../../types/memo';
import './MemoItem.css';

interface MemoItemProps {
  memo: Memo;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function MemoItem({ memo, isSelected, onSelect, onDelete }: MemoItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 메모를 삭제하시겠습니까?')) {
      onDelete();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPreview = (content: string) => {
    return content.length > 60 ? content.substring(0, 60) + '...' : content;
  };

  return (
    <div 
      className={`memo-item ${isSelected ? 'selected' : ''} color-${memo.color}`}
      onClick={onSelect}
    >
      <div className="memo-item-header">
        <h3 className="memo-item-title">{memo.title}</h3>
        <button className="delete-btn" onClick={handleDelete}>
          ×
        </button>
      </div>
      {memo.content && (
        <p className="memo-item-preview">{getPreview(memo.content)}</p>
      )}
      <div className="memo-item-footer">
        <span className="memo-item-date">{formatDate(memo.updatedAt)}</span>
      </div>
    </div>
  );
}
