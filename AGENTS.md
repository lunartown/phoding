# 커밋 메시지 규칙

- 프리픽스는 다음 형식을 사용합니다: `FEAT:(CORE)`
- 프리픽스 뒤에는 한글로 변경 사항을 간결히 작성합니다.
- 예시: `FEAT:(CORE) 유모차 결제 내역을 조회할 수 있다`

## 작성 가이드
- 변경 핵심을 한 문장으로 요약합니다.
- 구현 세부 대신 결과/효과를 중심으로 기술합니다.
- 한국어 종결어미는 평서형을 사용합니다.

## 예시
- `FEAT:(CORE) 루트 .gitignore 추가 및 env 예시파일 생성`
- `FEAT:(CORE) 결제 실패 사유를 사용자에게 노출한다`
- `FEAT:(CORE) 알림 구독 해지를 처리할 수 있다`

---

## 운영 실수 방지 메모

- 프로덕션 서버에서 `git reset --hard` 같은 파괴적 명령은 절대 실행하지 않는다. 배포는 항상 CI/CD 워크플로로 처리하고, 롤백이 필요하면 새 커밋 혹은 태그를 통해 진행한다.
- 사용자가 충분한 권한과 자격 증명을 이미 제공했다면 “못 한다”라고 물러서지 말고, 억측하지 말고 직접 시도해서 결과로 답한다.
- `.env` 파일에는 API 키, DB 접속 정보 등 비밀 값이 들어가므로 리포지토리에 올리지 않는다. 분실 시에는 Secret Manager나 인프라 팀으로부터 안전하게 복구한다.
- Cloud SQL 접속이 필요할 때는 `gcloud sql instances describe`로 connectionName을 확인하고, `gcloud sql users set-password`로 비밀번호를 재발급해 운영용 `DATABASE_URL`을 갱신한다.
- CI/CD 배포가 실패하면 GitHub Actions 로그를 먼저 확인하고, `gh run rerun <run_id>`로 재실행하되, 실패 원인(예: 누락된 env 파일, 권한 문제)을 반드시 해결한 뒤 반복한다.
- 서버 디스크가 가득 찬 상태에서는 gcloud 등 명령이 실패하므로, 배포 전 `docker image prune -af` 같은 청소 작업으로 충분한 여유 공간을 확보한다.

# Phoding 프로젝트 - AI 에이전트를 위한 컨텍스트 문서

## 🎯 프로젝트 본질
**Phoding**은 모바일에서 AI 에이전트와 대화하며 실시간으로 코드를 수정하고 결과를 확인하는 시스템입니다.
- 사용자의 자연어 지시 → AI 에이전트가 JSON operations 생성 → 서버가 파일 수정 → Vite로 즉시 프리뷰

## 🏗️ 시스템 구조

### 1. Frontend (Next.js PWA) - `/frontend`
**역할**: 모바일 UI 제공
- 채팅 인터페이스 (자연어 지시 입력)
- Operations 로그 표시
- iframe으로 프리뷰 표시
- 세션 관리 (sessionId 유지)

### 2. Gateway Server (Nest.js) - `/gateway`
**역할**: AI와 파일시스템 중개
- AI 에이전트 호출 (Claude API)
- JSON operations를 받아서 파일에 적용
- Vite dev server 프로세스 관리
- 최소한의 세션 정보 유지 (최근 지시 요약)

### 3. Workspace - `/workspace`
**역할**: 실제 수정되는 프로젝트
- Vite + React + TypeScript 템플릿
- Gateway가 이 폴더의 파일들을 수정
- Vite dev server가 자동으로 변경사항 반영

## 📊 데이터 흐름
```
사용자 입력 → Frontend → Gateway → AI Agent
                            ↓
                      JSON Operations
                            ↓
                      파일 시스템 수정
                            ↓
                      Vite Dev Server
                            ↓
                    Frontend iframe 프리뷰
```

## 🔌 핵심 API

### POST /agent/ask
```typescript
// Request
{
  sessionId: string,
  instruction: string,      // 사용자의 자연어 지시
  fileHints?: string[]      // 선택적: 관련 파일 힌트
}

// Response
{
  sessionId: string,
  status: 'success' | 'error',
  operations: JSONOperation[],  // 적용된 operations
  logs: string[],               // 실행 로그
  error?: string
}
```

### POST /preview/start
```typescript
// Request
{
  sessionId: string
}

// Response
{
  previewUrl: string,
  status: 'running' | 'starting' | 'error'
}
```

## 📝 JSON Operations 형식
AI 에이전트는 다음 형식의 operations를 반환해야 합니다:
```typescript
type JSONOperation =
  | { type: 'create', path: string, content: string }
  | { type: 'update', path: string, content: string }
  | { type: 'delete', path: string }
  | { type: 'rename', oldPath: string, newPath: string }
```

## 🚀 현재 개발 상태

### 완료된 작업(내부 테스트 중)
- [x] 프로젝트 문서 구조 수립 (루트/폴더별 README, 배포 가이드)
- [x] 아키텍처 설계

### Phase 1 (MVP)
- [x] Frontend 기본 UI 구현
  - [x] 채팅 입력 컴포넌트
  - [x] Operations 로그 뷰어
  - [x] iframe 프리뷰 컨테이너
- [x] Gateway 서버 구현
  - [x] /agent/ask 엔드포인트
  - [x] JSON operations 파서 및 적용 로직
  - [x] Vite dev server 프로세스 관리
- [x] Workspace 템플릿 설정
  - [x] Vite + React + TS 기본 설정
  - [x] 샘플 컴포넌트 추가

### Phase 2 (계획)
- 세션 데이터 영속화 (SQLite)
- Operations 히스토리 저장
- 프리뷰 서버 헬스체크 및 자동 재시작

### Phase 3 (계획)
- Git 통합 (자동 커밋/브랜치)
- 테스트 실행 및 빌드 결과 표시
- 사용자별 워크스페이스 격리

## ⚠️ 중요 제약사항

1. **컨텍스트 관리**: AI 에이전트가 자체적으로 수행 (서버는 최근 지시 요약만 전달)
2. **파일 수정**: workspace 폴더 내에서만 가능
3. **프리뷰**: 단일 Vite dev server 인스턴스 (MVP 단계)
4. **보안**: MVP에서는 인증/권한 없음 (로컬 개발용)

### 포트/환경 변수 규칙
- 프론트엔드: 3001, 게이트웨이: 3002(권장), 프리뷰(Vite): 5173(외부 노출 금지)
- `frontend`는 `NEXT_PUBLIC_GATEWAY_URL`이 없으면 `hostname:3002`로 폴백
- `gateway`는 `.env`에서 `PORT=3002` 설정 권장(프론트 폴백과 일치)

## 🛠️ 개발 시 참고사항

### 파일 경로
- Frontend 코드: `/frontend/src/`
- Gateway 코드: `/gateway/src/`
- Workspace 템플릿: `/workspace/`
- 프로젝트 문서: `/project_docs/`

### 주요 기술 스택
- Frontend: Next.js 14+, TypeScript, Tailwind CSS
- Backend: Nest.js, TypeScript
- Workspace: Vite 5+, React 18+, TypeScript
- AI: Claude API (Anthropic)

### 실행 명령어
```bash
# Frontend
cd frontend && npm run dev

# Gateway
cd gateway && npm run start:dev

# Workspace preview (Gateway가 자동 실행)
cd workspace && npm run dev
```

## 💡 AI 에이전트 작업 시 핵심 포인트

1. **Operations 생성 시**: 항상 workspace 폴더 기준 상대 경로 사용
2. **파일 수정 시**: 전체 파일 내용을 제공 (부분 수정 미지원)
3. **에러 처리**: 명확한 에러 메시지와 복구 방법 제시
4. **세션 유지**: sessionId로 연속된 작업 추적

## 📚 추가 문서
상세한 내용은 `/project_docs/` 폴더의 문서들을 참조:
- `0_PROJECT_OVERVIEW.md`: 프로젝트 개요
- `1_ARCHITECTURE.md`: 아키텍처 설계
- `2_GATEWAY.md`: Gateway 서버 상세
- `3_FRONTEND.md`: Frontend 설계
- `4_WORKSPACE_PREVIEW.md`: 워크스페이스 및 프리뷰
- `5_DATAFLOW_API.md`: 데이터 흐름 및 API
- `6_DEV_PLAN.md`: 개발 계획
- `7_EXTENSION_PLAN.md`: 확장 계획
