import { ZodiacSign, ZodiacInfo } from '../types'
import './ZodiacSelector.css'

interface ZodiacSelectorProps {
  onSelect: (zodiac: ZodiacSign) => void
}

const zodiacList: ZodiacInfo[] = [
  { name: '양자리', symbol: '♈', dateRange: '3/21 - 4/19' },
  { name: '황소자리', symbol: '♉', dateRange: '4/20 - 5/20' },
  { name: '쌍둥이자리', symbol: '♊', dateRange: '5/21 - 6/21' },
  { name: '게자리', symbol: '♋', dateRange: '6/22 - 7/22' },
  { name: '사자자리', symbol: '♌', dateRange: '7/23 - 8/22' },
  { name: '처녀자리', symbol: '♍', dateRange: '8/23 - 9/22' },
  { name: '천칭자리', symbol: '♎', dateRange: '9/23 - 10/23' },
  { name: '전갈자리', symbol: '♏', dateRange: '10/24 - 11/22' },
  { name: '사수자리', symbol: '♐', dateRange: '11/23 - 12/21' },
  { name: '염소자리', symbol: '♑', dateRange: '12/22 - 1/19' },
  { name: '물병자리', symbol: '♒', dateRange: '1/20 - 2/18' },
  { name: '물고기자리', symbol: '♓', dateRange: '2/19 - 3/20' },
]

function ZodiacSelector({ onSelect }: ZodiacSelectorProps) {
  return (
    <div className="zodiac-grid">
      {zodiacList.map((zodiac) => (
        <button
          key={zodiac.name}
          className="zodiac-card"
          onClick={() => onSelect(zodiac.name)}
        >
          <div className="zodiac-symbol">{zodiac.symbol}</div>
          <div className="zodiac-name">{zodiac.name}</div>
          <div className="zodiac-date">{zodiac.dateRange}</div>
        </button>
      ))}
    </div>
  )
}

export default ZodiacSelector