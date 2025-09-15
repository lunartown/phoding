# 데이터 흐름 & API 계약

## 데이터 흐름
1. 사용자가 지시 입력.  
2. 프론트가 Gateway에 요청.  
3. Gateway가 에이전트 호출, JSON ops 수신.  
4. Gateway가 ops 적용.  
5. Vite dev 반영.  
6. 프론트 iframe에서 결과 확인.  

## API

### POST /agent/ask
요청: 세션 ID, 지시, 선택적 파일 힌트.  
응답: 실행 결과, ops, 로그, 세션 ID.  

### POST /preview/start
요청: 세션 ID.  
응답: 프리뷰 URL.  
