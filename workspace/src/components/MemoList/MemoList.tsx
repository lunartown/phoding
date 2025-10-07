import { Memo } from '../../types/memo';
import { MemoItem } from '../MemoItem/MemoItem';
import './MemoList.css';

interface MemoListProps {
  memos: Memo[];
  selectedMemo: Memo | null;
  onSelectMemo: (memo: Memo) => void;
  onDeleteMemo: (id: string) => void;
}

export function MemoList({ memos, selectedMemo, onSelectMemo, onDeleteMemo }: MemoListProps) {
  return (
    <div className="memo-list">
      {memos.length === 0 ? (
        <div className="no-memos">
          <p>메모가 없습니다</p>
        </div>
      ) : (
        memos.map(memo => (
          <MemoItem
            key={memo.id}
            memo={memo}
            isSelected={selectedMemo?.id === memo.id}
            onSelect={() => onSelectMemo(memo)}
            onDelete={() => onDeleteMemo(memo.id)}
          />
        ))
      )}
    </div>
  );
}
