# Phoding

모바일에서 AI 에이전트와 대화하며 실시간으로 코드를 수정하고 프리뷰로 확인하는 시스템입니다.

## 구성 요소
- `frontend` (Next.js): 채팅 UI, 작업 로그, 프리뷰 iframe
- `gateway` (NestJS): AI 호출(Anthropic), JSON 작업 적용, Vite 프리뷰 프로세스/프록시
- `workspace` (Vite+React+TS): 실제 수정되는 앱(프리뷰 대상)
- `deploy` (Docker Compose + Nginx): 배포 템플릿

## 빠른 시작(로컬 개발)
사전 요구
- Node.js 22.x (`.nvmrc` = 22)
- npm

환경 변수
- `gateway/.env`
  - `ANTHROPIC_API_KEY` (필수)
  - `PORT=3002` (권장: 프론트엔드 기본 폴백과 일치)
  - `PUBLIC_GATEWAY_URL` (선택)
- `frontend/.env.local`
  - `NEXT_PUBLIC_GATEWAY_URL` (권장: 게이트웨이 공개 URL 설정. 미설정 시 `hostname:3002`로 폴백)

실행 순서
1) 게이트웨이
```
cd gateway
npm install
PORT=3002 npm run start:dev
```
2) 프론트엔드
```
cd frontend
npm install
npm run dev  # http://localhost:3001
```
3) 채팅 탭에서 지시를 입력하면 게이트웨이가 `workspace`에 파일을 적용하고, 프리뷰(iframe)가 자동으로 열립니다.

포트/프록시
- 프론트엔드: 3001
- 게이트웨이(API): 3002 (권장값)
- 프리뷰(Vite): 5173 (외부 노출 금지, 게이트웨이 프록시를 통해 접근)

## 데이터 흐름
사용자 입력 → Frontend → Gateway → Claude API → JSON Operations → 파일 시스템 수정(`workspace`) → Vite 프리뷰 → Frontend iframe 렌더링

## API 요약
- `POST /agent/ask` → JSON 작업 생성/적용 결과 반환
- `POST /preview/start` → Vite 프리뷰 가동 및 URL 반환

## 보안/운영 주의
- 비밀키는 깃에 올리지 않습니다. `.env`는 ignore 대상(확인 완료).
- `ANTHROPIC_API_KEY`는 비밀관리 서비스/환경변수로 주입하세요.
- MVP 단계에서는 인증이 없습니다. `/agent/*` 노출 시 역프록시/헤더 검증 등 보호 적용을 권장합니다.

## 배포 개요
- `deploy/docker-compose.yml`: `gateway(3002)`, `frontend(3001)`, `nginx(80/443)`
- Nginx가 `frontend`/`gateway`를 역프록시
- Vite(5173)는 컨테이너 내부에서 게이트웨이가 접근하고 외부 노출하지 않습니다.

## 문서 맵
- 프로젝트 개요/흐름: `CLAUDE.md`
- 상세 설계: `project_docs/*.md`
- 배포 가이드: `deploy/README.md`

