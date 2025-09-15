import { FC } from 'react';

interface ExampleProps {
  title: string;
}

const Example: FC<ExampleProps> = ({ title }) => {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
};

export default Example;