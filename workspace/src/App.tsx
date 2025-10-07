import { useState } from 'react';
import { FortuneCard } from './components/FortuneCard';
import { ZodiacSelector } from './components/ZodiacSelector';
import { generateFortune } from './utils/fortuneGenerator';
import { Fortune, Zodiac } from './types';

function App() {
  const [selectedZodiac, setSelectedZodiac] = useState<Zodiac | null>(null);
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleZodiacSelect = (zodiac: Zodiac) => {
    setSelectedZodiac(zodiac);
    setFortune(null);
    setIsRevealed(false);
  };

  const handleGetFortune = () => {
    if (selectedZodiac) {
      const newFortune = generateFortune(selectedZodiac);
      setFortune(newFortune);
      setIsRevealed(true);
    }
  };

  const handleReset = () => {
    setSelectedZodiac(null);
    setFortune(null);
    setIsRevealed(false);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">🔮 오늘의 운세 🔮</h1>
          <p className="subtitle">당신의 별자리를 선택하고 오늘의 운세를 확인하세요</p>
        </header>

        {!selectedZodiac ? (
          <ZodiacSelector onSelect={handleZodiacSelect} />
        ) : (
          <div className="fortune-section">
            <div className="selected-zodiac">
              <span className="zodiac-icon">{selectedZodiac.icon}</span>
              <h2>{selectedZodiac.name}</h2>
              <p className="zodiac-period">{selectedZodiac.period}</p>
            </div>

            {!isRevealed ? (
              <button className="fortune-button" onClick={handleGetFortune}>
                운세 보기
              </button>
            ) : (
              fortune && <FortuneCard fortune={fortune} />
            )}

            <button className="reset-button" onClick={handleReset}>
              다시 선택하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;