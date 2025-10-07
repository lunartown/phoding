import { Memo } from './types';

interface MemoListItemProps {
  memo: Memo;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function MemoListItem({ memo, isSelected, onSelect, onDelete }: MemoListItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const getPreview = (content: string) => {
    return content.split('\n')[0].slice(0, 50) || '내용 없음';
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 메모를 삭제하시겠습니까?')) {
      onDelete();
    }
  };

  return (
    <div
      className={`memo-list-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="memo-list-item-header">
        <h3 className="memo-list-item-title">{memo.title}</h3>
        <button
          className="btn-delete"
          onClick={handleDelete}
          title="삭제"
        >
          ×
        </button>
      </div>
      <p className="memo-list-item-preview">{getPreview(memo.content)}</p>
      <span className="memo-list-item-date">{formatDate(memo.updatedAt)}</span>
    </div>
  );
}