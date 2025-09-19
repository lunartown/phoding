# Gateway 서버 설계

## 책임
- 에이전트 API 호출.  
- JSON ops 적용.  
- 프리뷰 프로세스 실행 및 유지.  
- 간단한 세션 정보 저장.  
- 로그 및 오류 수집.  

## 포트/프록시
- API: 기본 3000, 권장 3002 (프론트 폴백과 일치)
- 프리뷰(Vite): 5173 (외부 노출 금지, Gateway가 HTTP/WS 프록시)
- 프록시 제외 경로: `/agent`, `/preview`, `/frontend`

## 환경 변수
- `ANTHROPIC_API_KEY` (필수)
- `PORT` (권장 3002)
- `PUBLIC_GATEWAY_URL` (선택)
- `PUBLIC_VITE_URL` (선택)

## 엔드포인트
- POST /agent/ask  
  입력: 세션 ID, 지시, 선택적 파일 힌트.  
  처리: 에이전트 호출 → ops 반환 → 파일 적용.  
  출력: 결과 상태, ops, 로그, 세션 ID.  

- POST /preview/start  
  프리뷰 서버 실행 및 URL 반환.  

## 에러/재시도
- Claude 과부하/레이트리밋 시 최대 3회 지수 백오프
- JSON 텍스트 블록(```) 제거 후 파싱 처리

## 통합 방식
- 에이전트에게는 시스템 메시지로 JSON ops만 출력하도록 강제.  
- 서버는 최근 지시 일부를 요약해 전달할 수 있다.  
- 파일 원문은 필요 시 사용자 힌트가 있을 때만 첨부한다.  
