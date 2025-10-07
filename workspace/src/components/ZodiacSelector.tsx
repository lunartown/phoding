import { zodiacSigns } from '../data/zodiacSigns';
import { Zodiac } from '../types';

interface ZodiacSelectorProps {
  onSelect: (zodiac: Zodiac) => void;
}

export function ZodiacSelector({ onSelect }: ZodiacSelectorProps) {
  return (
    <div className="zodiac-grid">
      {zodiacSigns.map((zodiac) => (
        <button
          key={zodiac.id}
          className="zodiac-card"
          onClick={() => onSelect(zodiac)}
        >
          <span className="zodiac-icon-large">{zodiac.icon}</span>
          <h3>{zodiac.name}</h3>
          <p className="zodiac-period-small">{zodiac.period}</p>
        </button>
      ))}
    </div>
  );
}