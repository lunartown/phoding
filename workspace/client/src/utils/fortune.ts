import { Fortune, ZodiacSign } from '../types'

const fortuneMessages: Record<ZodiacSign, string[]> = {
  '양자리': [
    '오늘은 새로운 시작에 좋은 날입니다. 용기를 내어 도전해보세요.',
    '활력이 넘치는 하루가 될 것입니다. 적극적으로 행동하세요.',
    '예상치 못한 기회가 찾아올 수 있습니다.'
  ],
  '황소자리': [
    '차분히 현재에 집중하면 좋은 결과가 있을 것입니다.',
    '물질적인 안정을 얻을 수 있는 날입니다.',
    '인내심을 가지고 꾸준히 나아가세요.'
  ],
  '쌍둥이자리': [
    '소통이 원활한 날입니다. 많은 사람들과 대화를 나눠보세요.',
    '호기심을 따라가면 새로운 발견이 있을 것입니다.',
    '다양한 정보를 접할 수 있는 좋은 시기입니다.'
  ],
  '게자리': [
    '가족이나 가까운 사람과의 시간이 행복을 가져다줄 것입니다.',
    '감성적인 하루가 될 것입니다. 마음의 소리에 귀 기울이세요.',
    '집에서 편안한 시간을 보내는 것이 좋겠습니다.'
  ],
  '사자자리': [
    '당신의 리더십이 빛을 발하는 날입니다.',
    '자신감을 가지고 앞으로 나아가세요.',
    '주변 사람들의 주목을 받을 수 있는 날입니다.'
  ],
  '처녀자리': [
    '세심한 계획이 성공으로 이어질 것입니다.',
    '분석적인 사고가 문제 해결에 도움이 됩니다.',
    '정리와 정돈이 마음의 평화를 가져다줄 것입니다.'
  ],
  '천칭자리': [
    '균형과 조화를 추구하면 좋은 날입니다.',
    '대인관계에서 좋은 소식이 있을 것입니다.',
    '아름다운 것들이 당신에게 영감을 줄 것입니다.'
  ],
  '전갈자리': [
    '직관력이 예리한 날입니다. 본능을 믿으세요.',
    '깊이 있는 대화가 중요한 통찰을 가져다줄 것입니다.',
    '변화를 두려워하지 마세요.'
  ],
  '사수자리': [
    '모험심이 솟구치는 날입니다. 새로운 경험을 해보세요.',
    '긍정적인 에너지가 넘치는 하루가 될 것입니다.',
    '배움의 기회가 찾아올 수 있습니다.'
  ],
  '염소자리': [
    '목표를 향해 꾸준히 전진하세요.',
    '책임감 있는 행동이 신뢰를 쌓아줄 것입니다.',
    '장기적인 계획을 세우기 좋은 날입니다.'
  ],
  '물병자리': [
    '독창적인 아이디어가 떠오를 수 있습니다.',
    '자유로운 사고방식이 새로운 길을 열어줄 것입니다.',
    '친구들과의 만남이 즐거움을 가져다줄 것입니다.'
  ],
  '물고기자리': [
    '상상력과 창의력이 빛을 발하는 날입니다.',
    '감성적인 활동이 마음을 치유해줄 것입니다.',
    '직관을 따라가면 좋은 결과가 있을 것입니다.'
  ]
}

const adviceList: string[] = [
  '오늘은 긍정적인 마음가짐을 유지하세요.',
  '주변 사람들에게 친절을 베풀어보세요.',
  '자신에게 작은 선물을 해보는 것은 어떨까요?',
  '충분한 휴식을 취하는 것을 잊지 마세요.',
  '새로운 것에 도전해보세요.',
  '감사한 마음을 표현해보세요.',
  '건강 관리에 신경 써주세요.',
  '소중한 사람과 시간을 보내세요.'
]

const colors = ['빨강', '파랑', '노랑', '초록', '보라', '주황', '분홍', '하늘색', '금색', '은색']

function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

function getTodaySeed(): number {
  const today = new Date()
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
}

export function getFortuneByZodiac(zodiac: ZodiacSign): Fortune {
  const todaySeed = getTodaySeed()
  const zodiacIndex = Object.keys(fortuneMessages).indexOf(zodiac)
  const seed = todaySeed + zodiacIndex

  const overall = Math.floor(seededRandom(seed) * 5) + 1
  const love = Math.floor(seededRandom(seed + 1) * 5) + 1
  const money = Math.floor(seededRandom(seed + 2) * 5) + 1
  const health = Math.floor(seededRandom(seed + 3) * 5) + 1

  const messageIndex = Math.floor(seededRandom(seed + 4) * fortuneMessages[zodiac].length)
  const message = fortuneMessages[zodiac][messageIndex]

  const colorIndex = Math.floor(seededRandom(seed + 5) * colors.length)
  const luckyColor = colors[colorIndex]

  const luckyNumber = Math.floor(seededRandom(seed + 6) * 99) + 1

  const adviceIndex = Math.floor(seededRandom(seed + 7) * adviceList.length)
  const advice = adviceList[adviceIndex]

  return {
    overall,
    love,
    money,
    health,
    message,
    luckyColor,
    luckyNumber,
    advice
  }
}