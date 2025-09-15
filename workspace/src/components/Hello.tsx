import React from 'react';

interface HelloProps {
  name?: string;
}

export const Hello: React.FC<HelloProps> = ({ name = 'World' }) => {
  return <h1>Hello, {name}!</h1>;
};
