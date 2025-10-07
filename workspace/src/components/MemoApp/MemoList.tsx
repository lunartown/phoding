import { Memo } from './types';
import { MemoListItem } from './MemoListItem';

interface MemoListProps {
  memos: Memo[];
  selectedMemoId: string | null;
  onSelectMemo: (id: string) => void;
  onDeleteMemo: (id: string) => void;
}

export function MemoList({ memos, selectedMemoId, onSelectMemo, onDeleteMemo }: MemoListProps) {
  return (
    <div className="memo-list">
      {memos.length === 0 ? (
        <div className="memo-list-empty">
          <p>메모가 없습니다</p>
        </div>
      ) : (
        memos.map(memo => (
          <MemoListItem
            key={memo.id}
            memo={memo}
            isSelected={memo.id === selectedMemoId}
            onSelect={() => onSelectMemo(memo.id)}
            onDelete={() => onDeleteMemo(memo.id)}
          />
        ))
      )}
    </div>
  );
}