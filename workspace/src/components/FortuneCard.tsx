import { Fortune } from '../types';

interface FortuneCardProps {
  fortune: Fortune;
}

export function FortuneCard({ fortune }: FortuneCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#fbbf24';
    return '#f87171';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '😊';
    if (score >= 60) return '😐';
    return '😢';
  };

  return (
    <div className="fortune-card">
      <div className="fortune-header">
        <h3>오늘의 운세</h3>
        <div className="date">{fortune.date}</div>
      </div>

      <div className="fortune-content">
        <div className="fortune-message">
          <p>{fortune.message}</p>
        </div>

        <div className="fortune-scores">
          <div className="score-item">
            <span className="score-label">💖 애정운</span>
            <div className="score-bar">
              <div
                className="score-fill"
                style={{
                  width: `${fortune.loveScore}%`,
                  backgroundColor: getScoreColor(fortune.loveScore),
                }}
              />
            </div>
            <span className="score-value">
              {fortune.loveScore}점 {getScoreEmoji(fortune.loveScore)}
            </span>
          </div>

          <div className="score-item">
            <span className="score-label">💰 금전운</span>
            <div className="score-bar">
              <div
                className="score-fill"
                style={{
                  width: `${fortune.moneyScore}%`,
                  backgroundColor: getScoreColor(fortune.moneyScore),
                }}
              />
            </div>
            <span className="score-value">
              {fortune.moneyScore}점 {getScoreEmoji(fortune.moneyScore)}
            </span>
          </div>

          <div className="score-item">
            <span className="score-label">💼 직업운</span>
            <div className="score-bar">
              <div
                className="score-fill"
                style={{
                  width: `${fortune.careerScore}%`,
                  backgroundColor: getScoreColor(fortune.careerScore),
                }}
              />
            </div>
            <span className="score-value">
              {fortune.careerScore}점 {getScoreEmoji(fortune.careerScore)}
            </span>
          </div>

          <div className="score-item">
            <span className="score-label">🍀 행운운</span>
            <div className="score-bar">
              <div
                className="score-fill"
                style={{
                  width: `${fortune.luckScore}%`,
                  backgroundColor: getScoreColor(fortune.luckScore),
                }}
              />
            </div>
            <span className="score-value">
              {fortune.luckScore}점 {getScoreEmoji(fortune.luckScore)}
            </span>
          </div>
        </div>

        <div className="fortune-details">
          <div className="detail-item">
            <span className="detail-label">🎨 행운의 색상</span>
            <div className="lucky-color-container">
              <div
                className="lucky-color"
                style={{ backgroundColor: fortune.luckyColor }}
              />
              <span>{fortune.luckyColor}</span>
            </div>
          </div>
          <div className="detail-item">
            <span className="detail-label">🔢 행운의 숫자</span>
            <span className="detail-value">{fortune.luckyNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}