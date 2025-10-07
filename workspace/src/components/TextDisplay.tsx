import React from 'react';

interface TextDisplayProps {
  text: string;
}

const TextDisplay: React.FC<TextDisplayProps> = ({ text }) => {
  return (
    <div className="text-display">
      <h1>{text}</h1>
    </div>
  );
};

export default TextDisplay;