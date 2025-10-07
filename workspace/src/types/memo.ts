export interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
}

export type MemoColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';
