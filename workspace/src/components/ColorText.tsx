import React, { useState } from 'react';

interface ColorTextProps {
  text: string;
}

export const ColorText: React.FC<ColorTextProps> = ({ text }) => {
  const [color, setColor] = useState('#000000');

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#FFFF00', '#00FFFF'];

  const changeColor = () => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setColor(randomColor);
  };

  return (
    <span 
      style={{ color: color, cursor: 'pointer' }}
      onClick={changeColor}
    >
      {text}
    </span>
  );
};
