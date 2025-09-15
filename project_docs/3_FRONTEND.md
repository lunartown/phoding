# 프론트엔드 설계

## 책임
- 모바일 친화 UI 제공.  
- 지시 입력, 결과 로그 및 ops 표시.  
- 프리뷰 iframe 연결.  

## 주요 화면
- Chat: 입력창, 지시 기록, 선택적 파일 힌트 입력.  
- Logs: ops 실행 결과 및 상태 표시.  
- Preview: iframe으로 Vite dev 서버 렌더링.  

## 상태 관리
- MVP 단계에서는 React 훅으로 처리.  
- 이후 sessionId를 URL이나 로컬스토리지로 보존.  
