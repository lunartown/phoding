import { useState } from 'react'
import './App.css'
import { Fortune, ZodiacSign } from './types'
import { getFortuneByZodiac } from './utils/fortune'
import FortuneCard from './components/FortuneCard'
import ZodiacSelector from './components/ZodiacSelector'

function App() {
  const [selectedZodiac, setSelectedZodiac] = useState<ZodiacSign | null>(null)
  const [fortune, setFortune] = useState<Fortune | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)

  const handleZodiacSelect = (zodiac: ZodiacSign) => {
    setSelectedZodiac(zodiac)
    setIsRevealed(false)
    setFortune(null)
  }

  const handleRevealFortune = () => {
    if (selectedZodiac) {
      const todayFortune = getFortuneByZodiac(selectedZodiac)
      setFortune(todayFortune)
      setIsRevealed(true)
    }
  }

  const handleReset = () => {
    setSelectedZodiac(null)
    setFortune(null)
    setIsRevealed(false)
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">🔮 오늘의 운세</h1>
          <p className="subtitle">당신의 별자리를 선택하고 오늘의 운세를 확인해보세요</p>
        </header>

        {!selectedZodiac ? (
          <ZodiacSelector onSelect={handleZodiacSelect} />
        ) : (
          <div className="fortune-section">
            {!isRevealed ? (
              <div className="reveal-container">
                <p className="selected-zodiac">{selectedZodiac} 선택됨</p>
                <button className="reveal-button" onClick={handleRevealFortune}>
                  ✨ 운세 보기
                </button>
                <button className="back-button" onClick={handleReset}>
                  ← 다시 선택
                </button>
              </div>
            ) : fortune ? (
              <>
                <FortuneCard fortune={fortune} zodiac={selectedZodiac} />
                <button className="reset-button" onClick={handleReset}>
                  다시 보기
                </button>
              </>
            ) : null}
          </div>
        )}

        <footer className="footer">
          <p>매일 새로운 운세로 업데이트됩니다 ✨</p>
        </footer>
      </div>
    </div>
  )
}

export default App