export type ZodiacSign =
  | '양자리'
  | '황소자리'
  | '쌍둥이자리'
  | '게자리'
  | '사자자리'
  | '처녀자리'
  | '천칭자리'
  | '전갈자리'
  | '사수자리'
  | '염소자리'
  | '물병자리'
  | '물고기자리'

export interface Fortune {
  overall: number // 1-5 stars
  love: number
  money: number
  health: number
  message: string
  luckyColor: string
  luckyNumber: number
  advice: string
}

export interface ZodiacInfo {
  name: ZodiacSign
  symbol: string
  dateRange: string
}