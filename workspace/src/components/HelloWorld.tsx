import React from 'react';

interface HelloWorldProps {
  message?: string;
}

const HelloWorld: React.FC<HelloWorldProps> = ({ message = 'Hello World' }) => {
  return (
    <div className="hello-world">
      <h1>{message}</h1>
    </div>
  );
};

export default HelloWorld;
