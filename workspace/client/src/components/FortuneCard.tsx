import { Fortune, ZodiacSign } from '../types'
import './FortuneCard.css'

interface FortuneCardProps {
  fortune: Fortune
  zodiac: ZodiacSign
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="stars">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < rating ? 'star-filled' : 'star-empty'}>
          ★
        </span>
      ))}
    </div>
  )
}

function FortuneCard({ fortune, zodiac }: FortuneCardProps) {
  return (
    <div className="fortune-card">
      <div className="fortune-header">
        <h2>{zodiac}의 오늘 운세</h2>
        <div className="date">{new Date().toLocaleDateString('ko-KR')}</div>
      </div>

      <div className="fortune-content">
        <div className="fortune-section">
          <h3>📜 오늘의 메시지</h3>
          <p className="message">{fortune.message}</p>
        </div>

        <div className="fortune-stats">
          <div className="stat-item">
            <span className="stat-label">종합운</span>
            <StarRating rating={fortune.overall} />
          </div>
          <div className="stat-item">
            <span className="stat-label">애정운</span>
            <StarRating rating={fortune.love} />
          </div>
          <div className="stat-item">
            <span className="stat-label">금전운</span>
            <StarRating rating={fortune.money} />
          </div>
          <div className="stat-item">
            <span className="stat-label">건강운</span>
            <StarRating rating={fortune.health} />
          </div>
        </div>

        <div className="fortune-lucky">
          <div className="lucky-item">
            <span className="lucky-icon">🎨</span>
            <div>
              <div className="lucky-label">행운의 색</div>
              <div className="lucky-value">{fortune.luckyColor}</div>
            </div>
          </div>
          <div className="lucky-item">
            <span className="lucky-icon">🔢</span>
            <div>
              <div className="lucky-label">행운의 숫자</div>
              <div className="lucky-value">{fortune.luckyNumber}</div>
            </div>
          </div>
        </div>

        <div className="fortune-section advice">
          <h3>💡 조언</h3>
          <p>{fortune.advice}</p>
        </div>
      </div>
    </div>
  )
}

export default FortuneCard