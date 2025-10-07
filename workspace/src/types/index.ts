export interface Zodiac {
  id: string;
  name: string;
  icon: string;
  period: string;
  element: 'fire' | 'earth' | 'air' | 'water';
}

export interface Fortune {
  date: string;
  message: string;
  loveScore: number;
  moneyScore: number;
  careerScore: number;
  luckScore: number;
  luckyColor: string;
  luckyNumber: number;
}