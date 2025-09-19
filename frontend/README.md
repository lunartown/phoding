## Frontend (Next.js)

채팅 UI, 작업 로그, 프리뷰 iframe을 제공하는 앱입니다.

### 실행
```
npm install
npm run dev  # http://localhost:3001
```

### 환경 변수
- `NEXT_PUBLIC_GATEWAY_URL`
  - 설정 시 해당 URL의 `/agent/ask`, `/preview/start`로 호출합니다.
  - 미설정 시 브라우저 호스트 기준 `:3002` 포트로 폴백합니다.

### UI 구성
- Chat 탭: 지시 입력, 메시지 스트림 표시, 파일 힌트 입력 지원
- Logs 탭: JSON operations 목록/내용 일부 미리보기
- Preview 탭: 게이트웨이가 반환한 프리뷰 URL을 iframe으로 표시

### 게이트웨이 연동
- `components/ChatInput.tsx`에서 게이트웨이 URL을 결정합니다.
  1) `NEXT_PUBLIC_GATEWAY_URL` 우선
  2) 그 외에는 `window.location.hostname:3002` 폴백

### 보안/운영
- 이 앱은 직접 비밀정보를 다루지 않습니다.
- 게이트웨이 인증/보안은 서버/역프록시에서 적용하세요.
