import { useState } from 'react';

interface SimpleTestProps {
  title?: string;
}

export const SimpleTest = ({ title = '간단한 테스트' }: SimpleTestProps) => {
  const [count, setCount] = useState(0);

  return (
    <div className="simple-test">
      <h2>{title}</h2>
      <p>현재 카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
      <button onClick={() => setCount(count - 1)}>감소</button>
    </div>
  );
};
