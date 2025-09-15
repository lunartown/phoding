# 아키텍처 설계

## 컴포넌트
- Frontend (Next.js PWA)  
  모바일 친화 UI. 입력 → Gateway 호출 → 결과 표시 → iframe 프리뷰.  

- Gateway (Nest.js)  
  에이전트 호출, JSON ops 파싱, 파일 수정, 프리뷰 프로세스 실행, 최소 세션 관리.  

- Workspace  
  실제 수정되는 프로젝트 폴더.  

## 데이터 흐름
1. 사용자가 지시 입력.  
2. 프론트가 Gateway API 호출.  
3. Gateway가 에이전트를 호출하고 ops를 받음.  
4. Gateway가 ops를 적용해 파일 수정.  
5. Vite dev가 변경을 반영.  
6. 프론트 iframe에서 결과 확인.  
