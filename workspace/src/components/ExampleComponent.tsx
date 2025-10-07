import React from 'react';

interface ExampleComponentProps {
  title: string;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({ title }) => {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
};
