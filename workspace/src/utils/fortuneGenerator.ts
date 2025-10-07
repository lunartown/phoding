import { Fortune, Zodiac } from '../types';
import { fortuneMessages } from '../data/fortuneMessages';

const luckyColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#52B788',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomScore(): number {
  return Math.floor(Math.random() * 40) + 60; // 60-100
}

function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
}

export function generateFortune(zodiac: Zodiac): Fortune {
  // 별자리와 날짜를 기반으로 시드 생성 (같은 날, 같은 별자리는 같은 운세)
  const today = new Date().toDateString();
  const seed = `${zodiac.id}-${today}`;
  const hashCode = seed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // 시드 기반 랜덤 함수
  const seededRandom = (min: number, max: number, offset: number = 0) => {
    const x = Math.sin(hashCode + offset) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  return {
    date: getTodayDate(),
    message: fortuneMessages[seededRandom(0, fortuneMessages.length - 1)],
    loveScore: seededRandom(50, 100, 1),
    moneyScore: seededRandom(50, 100, 2),
    careerScore: seededRandom(50, 100, 3),
    luckScore: seededRandom(50, 100, 4),
    luckyColor: luckyColors[seededRandom(0, luckyColors.length - 1, 5)],
    luckyNumber: seededRandom(1, 99, 6),
  };
}