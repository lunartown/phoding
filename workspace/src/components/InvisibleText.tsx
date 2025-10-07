import { useState } from 'react';
import styled from 'styled-components';

const HiddenText = styled.div`
  color: transparent;
  user-select: none;
  font-size: 24px;
  margin: 20px;
`;

export const InvisibleText = () => {
  const [text] = useState('제프 바보');

  return (
    <HiddenText>
      {text}
    </HiddenText>
  );
};
