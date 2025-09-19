## Gateway (NestJS)

AI 에이전트 호출(Claude API) → JSON 작업을 `workspace`에 적용 → Vite 프리뷰를 관리/프록시하는 서버입니다.

### 주요 책임
- `POST /agent/ask`: Claude 호출 → JSON operations 파싱 → 파일 시스템 적용
- `POST /preview/start`: Vite dev server(5173) 스폰 및 헬스체크
- 프록시: 루트 경로를 Vite로 프록시(HTTP/WS, HMR 지원), `/agent`/`/preview`/`/frontend` 예외 처리

### 실행
```
npm install
PORT=3002 npm run start:dev
```

### 환경 변수
- `ANTHROPIC_API_KEY` (필수)
- `PORT` (기본 3000, 권장 3002 — 프론트엔드 기본 폴백과 일치)
- `PUBLIC_GATEWAY_URL` (선택, 프리뷰 URL 구성에 사용)
- `PUBLIC_VITE_URL` (선택, 별도 프리뷰 공개 URL이 있을 때)

### 엔드포인트
- `POST /agent/ask`
  - 요청: `{ sessionId: string, instruction: string, fileHints?: string[] }`
  - 응답: `{ status: 'success'|'error', operations: JSONOperation[], logs: string[], error?: string }`
  - JSONOperation: `create|update|delete|rename` (업데이트 시 전체 파일 내용 필요)

- `POST /preview/start`
  - Vite 서버 실행 및 `{ previewUrl, status }` 반환

### 프록시 동작
- HTTP: 루트(`GET/HEAD`) 요청을 `http://localhost:5173`로 프록시
- WS: HMR 업그레이드(`/agent|/preview|/frontend` 제외)를 Vite로 프록시

### 오류/재시도
- Claude 과부하/레이트리밋 시 지수 백오프 최대 3회 재시도
- 응답이 JSON 텍스트 블록(```)을 포함하면 제거 후 파싱

### 보안
- MVP 단계: 인증 없음. `/agent/*` 노출 시 역프록시/헤더 검증 권장
- `.env`는 Git ignore 대상(확인됨). 비밀키는 비밀관리/환경변수로 주입
