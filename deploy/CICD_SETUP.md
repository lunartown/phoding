# GitHub Actions CI/CD 설정 가이드

## 📋 개요

`main` 브랜치에 push하면 자동으로 GCP Compute Engine VM에 배포됩니다.

**워크플로우:**
1. 테스트 (Lint + Prisma 스키마 검증)
2. Docker 이미지 빌드 & Artifact Registry에 push
3. VM에서 이미지 pull & 재시작

---

## 🔧 1단계: GCP 설정

### 1.1 Artifact Registry 저장소 생성

```bash
gcloud artifacts repositories create phoding \
  --repository-format=docker \
  --location=asia-northeast3 \
  --description="Phoding Docker images"
```

### 1.2 Service Account 생성 및 권한 부여

```bash
# Service Account 생성
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployer"

# 필요한 권한 부여
gcloud projects add-iam-policy-binding phoding \
  --member="serviceAccount:github-actions@phoding.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding phoding \
  --member="serviceAccount:github-actions@phoding.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"

gcloud projects add-iam-policy-binding phoding \
  --member="serviceAccount:github-actions@phoding.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# JSON 키 생성 (GitHub Secret에 등록할 파일)
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions@phoding.iam.gserviceaccount.com
```

### 1.3 VM 설정

VM에 Docker와 gcloud가 설치되어 있어야 합니다.

```bash
# VM에 SSH 접속
gcloud compute ssh [VM_NAME] --zone=[ZONE]

# Docker 설치 (아직 안 했다면)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# gcloud 인증 (Artifact Registry 접근용)
gcloud auth configure-docker asia-northeast3-docker.pkg.dev

# 프로젝트 디렉토리 생성
sudo mkdir -p /opt/phoding
sudo chown $USER:$USER /opt/phoding
cd /opt/phoding

# Git 초기 설정 (최초 1회만)
git clone https://github.com/[YOUR_USERNAME]/phoding.git .
cd deploy
cp gateway.env.example gateway.env
cp frontend.env.example frontend.env

# .env 파일 편집
vim gateway.env  # ANTHROPIC_API_KEY, DATABASE_URL (Cloud SQL 사용) 등 설정
vim frontend.env # NEXT_PUBLIC_GATEWAY_URL 설정
```

**중요**: DATABASE_URL은 Cloud SQL 연결 문자열을 사용해야 합니다. 자세한 내용은 `CLOUD_SQL_SETUP.md`를 참조하세요.

---

## 🔐 2단계: GitHub Secrets 설정

Repository Settings > Secrets and variables > Actions에서 다음 secrets 추가:

| Secret 이름 | 값 | 설명 |
|------------|----|----|
| `GCP_SA_KEY` | `~/github-actions-key.json` 내용 전체 | Service Account JSON 키 |
| `GCP_VM_NAME` | 예: `phoding-prod` | VM 인스턴스 이름 |
| `GCP_VM_ZONE` | 예: `asia-northeast3-a` | VM zone |

---

## 🚀 3단계: 배포 테스트

### 수동 워크플로우 실행

1. GitHub 저장소 > Actions 탭
2. "Deploy to GCP Compute Engine" 워크플로우 선택
3. "Run workflow" 버튼 클릭

### 자동 배포 테스트

```bash
# main 브랜치에 push
git add .
git commit -m "FEAT:(CORE) CI/CD 워크플로우 추가"
git push origin main
```

GitHub Actions 탭에서 진행 상황 확인 가능.

---

## 📊 워크플로우 단계별 설명

### Job 1: Test (약 2-3분)
- Frontend/Gateway lint 실행
- Prisma 스키마 검증
- 실패 시 배포 중단

### Job 2: Build and Push (약 5-10분)
- Frontend/Gateway Docker 이미지 빌드
- Artifact Registry에 push (태그: `latest`, `{commit-sha}`)

### Job 3: Deploy (약 1-2분)
- VM에 SSH 접속
- 최신 이미지 pull
- 컨테이너 재시작
- 사용하지 않는 이미지 정리

---

## 🔍 트러블슈팅

### VM SSH 접속 실패
```bash
# 로컬에서 테스트
gcloud compute ssh [VM_NAME] --zone=[ZONE]

# VM의 메타데이터 확인
gcloud compute instances describe [VM_NAME] --zone=[ZONE]
```

### Docker 이미지 pull 실패
```bash
# VM에서 인증 확인
gcloud auth configure-docker asia-northeast3-docker.pkg.dev

# 수동으로 pull 테스트
docker pull asia-northeast3-docker.pkg.dev/phoding/phoding/gateway:latest
```

### 컨테이너 시작 실패
```bash
# VM에서 로그 확인
cd /opt/phoding/deploy
docker compose -f docker-compose.prod.yml logs -f gateway
docker compose -f docker-compose.prod.yml logs -f frontend
```

---

## 🔄 롤백 방법

특정 커밋으로 롤백:

```bash
# VM에 SSH 접속
cd /opt/phoding/deploy

# 특정 커밋 SHA의 이미지로 변경
export ROLLBACK_SHA=abc1234
docker pull asia-northeast3-docker.pkg.dev/phoding/phoding/gateway:$ROLLBACK_SHA
docker pull asia-northeast3-docker.pkg.dev/phoding/phoding/frontend:$ROLLBACK_SHA

# docker-compose.prod.yml 임시 수정하거나
# 수동으로 컨테이너 재시작
docker compose -f docker-compose.prod.yml down
docker run -d --name phoding-gateway \
  --env-file gateway.env \
  asia-northeast3-docker.pkg.dev/phoding/phoding/gateway:$ROLLBACK_SHA
# (frontend도 동일)
```

---

## 📝 참고사항

- **빌드 시간 단축**: GitHub Actions의 Docker layer 캐싱 활성화 고려
- **보안**: Service Account는 최소 권한 원칙 적용
- **모니터링**: GCP Cloud Logging과 연동 권장
- **비용**: Artifact Registry 스토리지 비용 모니터링

---

## 다음 단계

- [ ] Slack/Discord 알림 연동
- [ ] 스테이징 환경 추가 (PR 기반)
- [ ] 자동 롤백 (헬스체크 실패 시)
- [ ] Blue-Green 배포
