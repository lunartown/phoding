# Codemore 프로젝트 - AI 에이전트를 위한 컨텍스트 문서

## 🎯 프로젝트 본질
**Codemore**는 모바일에서 AI 에이전트와 대화하며 실시간으로 코드를 수정하고 결과를 확인하는 시스템입니다.
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

### 완료된 작업
- [ ] 프로젝트 문서 작성
- [ ] 아키텍처 설계

### Phase 1 (MVP) - 현재 진행 중
- [ ] Frontend 기본 UI 구현
  - [ ] 채팅 입력 컴포넌트
  - [ ] Operations 로그 뷰어
  - [ ] iframe 프리뷰 컨테이너
- [ ] Gateway 서버 구현
  - [ ] /agent/ask 엔드포인트
  - [ ] JSON operations 파서 및 적용 로직
  - [ ] Vite dev server 프로세스 관리
- [ ] Workspace 템플릿 설정
  - [ ] Vite + React + TS 기본 설정
  - [ ] 샘플 컴포넌트 추가

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