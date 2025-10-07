# Workspace Template

이 폴더는 Gateway가 세션별 워크스페이스를 초기화할 때 복제하는 **React + TypeScript + Vite** 기본 템플릿입니다. 레포에는 항상 이 초기 상태만 보관하고, 실시간 편집 결과는 서버가 JSON operation으로 생성·관리합니다.

## 구성 원칙
- Git에는 템플릿 상태만 유지하고 세션 중 생성되는 산출물은 커밋하지 않습니다.
- `node_modules`, 빌드 결과물, 환경 파일 등 세션별 산출물은 `.gitignore`로 관리합니다.
- 필요 시 서버는 이 템플릿을 복사하거나 초기화한 뒤 Vite dev server와 연동합니다.

## 구조
- `src/`: Vite 기본 카운터 예제가 포함된 최소 React 애플리케이션
- `public/`: `vite.svg` 등 정적 자산
- `tsconfig.*`, `vite.config.ts`, `eslint.config.js`: 기본 도구 설정

## 로컬 확인 (필요한 경우에만)
```bash
npm install
npm run dev
```

> ⚠️ 운영 환경에서는 서버가 세션별로 파일을 조작하므로, 템플릿 외 파일을 레포에 추가하지 말고 항상 초기 상태를 유지해주세요.
