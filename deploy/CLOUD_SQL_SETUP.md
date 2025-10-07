# Cloud SQL PostgreSQL 설정 가이드

## 📋 개요

프로덕션 환경에서는 VM에서 PostgreSQL을 Docker로 실행하지 않고, Google Cloud SQL을 사용합니다.

**이점:**
- 자동 백업 및 복구
- 고가용성 (HA) 옵션
- 자동 패치 및 업데이트
- 확장 용이
- 모니터링 및 로깅 통합

---

## ✅ Cloud SQL 인스턴스 생성 (완료)

이미 다음 명령으로 생성되었습니다:

```bash
gcloud sql instances create phoding-db \
  --database-version=POSTGRES_16 \
  --tier=db-g1-small \
  --region=asia-northeast3 \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4 \
  --edition=ENTERPRISE
```

**스펙:**
- RAM: 1.7 GiB
- 리전: asia-northeast3 (서울)
- 백업: 매일 새벽 3시 자동 백업
- 유지보수: 일요일 새벽 4시

---

## 🔐 1단계: 데이터베이스 및 사용자 생성

### 1.1 루트 비밀번호 설정

```bash
gcloud sql users set-password postgres \
  --instance=phoding-db \
  --password=[STRONG_PASSWORD]
```

### 1.2 전용 사용자 생성

```bash
# 애플리케이션 전용 사용자 생성
gcloud sql users create phoding \
  --instance=phoding-db \
  --password=[APP_PASSWORD]

# 데이터베이스 생성
gcloud sql databases create phoding \
  --instance=phoding-db
```

---

## 🔌 2단계: 연결 설정

### 옵션 A: Public IP (간단, 빠른 설정)

#### 1. VM IP 허용

```bash
# VM의 Public IP 확인
VM_IP=$(gcloud compute instances describe server-1 \
  --zone=asia-northeast3-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

# Cloud SQL에 VM IP 허용
gcloud sql instances patch phoding-db \
  --authorized-networks=$VM_IP
```

#### 2. 연결 문자열

VM의 `deploy/gateway.env`에 다음 설정:

```bash
# Cloud SQL Public IP 확인
gcloud sql instances describe phoding-db \
  --format='get(ipAddresses[0].ipAddress)'

# gateway.env 예시
DATABASE_URL="postgresql://phoding:[APP_PASSWORD]@[CLOUD_SQL_PUBLIC_IP]:5432/phoding?schema=public"
```

### 옵션 B: Cloud SQL Proxy (권장, 더 안전)

#### 1. VM에 Cloud SQL Proxy 설치

VM에 SSH 접속 후:

```bash
# Cloud SQL Proxy 다운로드
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy

# systemd 서비스로 등록
sudo tee /etc/systemd/system/cloud-sql-proxy.service > /dev/null <<EOF
[Unit]
Description=Cloud SQL Proxy
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=/home/$USER/cloud_sql_proxy -instances=phoding:asia-northeast3:phoding-db=tcp:5432
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 서비스 시작
sudo systemctl daemon-reload
sudo systemctl enable cloud-sql-proxy
sudo systemctl start cloud-sql-proxy
```

#### 2. 연결 문자열

`deploy/gateway.env`:

```bash
# localhost:5432로 Cloud SQL Proxy를 통해 연결
DATABASE_URL="postgresql://phoding:[APP_PASSWORD]@localhost:5432/phoding?schema=public"
```

---

## 🔧 3단계: VM에서 설정 적용

### VM SSH 접속

```bash
gcloud compute ssh server-1 --zone=asia-northeast3-a
```

### gateway.env 수정

```bash
cd /opt/phoding/deploy
vim gateway.env
```

다음 내용 수정:

```bash
# 기존 (로컬 Docker PostgreSQL)
# DATABASE_URL="postgresql://phoding:phoding_dev_password@localhost:5432/phoding?schema=public"

# 새로운 (Cloud SQL)
DATABASE_URL="postgresql://phoding:[APP_PASSWORD]@[CLOUD_SQL_IP]:5432/phoding?schema=public"
```

### Prisma 마이그레이션 실행

```bash
# Gateway 컨테이너에서 마이그레이션 실행
cd /opt/phoding/deploy
docker compose -f docker-compose.prod.yml exec gateway npx prisma migrate deploy

# 또는 VM에서 직접 (프로젝트 클론되어 있다면)
cd /opt/phoding/gateway
npm install
npx prisma migrate deploy
```

### 컨테이너 재시작

```bash
cd /opt/phoding/deploy
docker compose -f docker-compose.prod.yml restart gateway
```

---

## 📊 4단계: 연결 확인

### 로그 확인

```bash
docker compose -f docker-compose.prod.yml logs -f gateway
```

성공 시 다음과 같은 로그 표시:

```
[Nest] INFO [PrismaService] Successfully connected to the database
```

### 수동 연결 테스트

```bash
# psql 설치 (VM에서)
sudo apt-get update && sudo apt-get install -y postgresql-client

# 연결 테스트 (Public IP 방식)
psql "postgresql://phoding:[APP_PASSWORD]@[CLOUD_SQL_IP]:5432/phoding"

# 연결 테스트 (Proxy 방식)
psql "postgresql://phoding:[APP_PASSWORD]@localhost:5432/phoding"
```

---

## 🔒 보안 권장사항

1. **비밀번호 강화**: 최소 32자 랜덤 생성
   ```bash
   openssl rand -base64 32
   ```

2. **IP 허용 최소화**: 필요한 IP만 허용

3. **SSL 연결 강제** (선택사항):
   ```bash
   DATABASE_URL="postgresql://phoding:[PASSWORD]@[IP]:5432/phoding?sslmode=require"
   ```

4. **Cloud SQL Proxy 사용**: Public IP 노출 최소화

5. **정기 백업 확인**:
   ```bash
   gcloud sql backups list --instance=phoding-db
   ```

---

## 💰 비용 최적화

### 현재 설정 (db-g1-small)
- 월 예상 비용: ~$25-30 USD
- RAM: 1.7 GiB
- 트래픽이 적다면 충분

### 더 저렴한 옵션 (개발/테스트)
```bash
# db-f1-micro (월 ~$7-10 USD)
# 단, ENTERPRISE 에디션에서는 사용 불가
```

### 비용 절감 팁
1. **자동 스토리지 증가 비활성화** (필요할 때 수동 증가)
2. **백업 보관 기간 조정** (기본 7일 → 3일)
   ```bash
   gcloud sql instances patch phoding-db --backup-start-time=03:00 --retained-backups-count=3
   ```
3. **개발 환경은 VM Docker PostgreSQL 사용**

---

## 🔄 마이그레이션 체크리스트

- [x] Cloud SQL 인스턴스 생성
- [x] docker-compose.prod.yml에서 postgres 서비스 제거
- [ ] 데이터베이스 및 사용자 생성
- [ ] VM 네트워크 허용 또는 Cloud SQL Proxy 설치
- [ ] gateway.env에 DATABASE_URL 수정
- [ ] Prisma 마이그레이션 실행
- [ ] 컨테이너 재시작 및 연결 확인
- [ ] 기존 Docker PostgreSQL 데이터 백업 (필요시)

---

## 🆘 트러블슈팅

### 연결 실패: "connection refused"
```bash
# 1. Cloud SQL IP 확인
gcloud sql instances describe phoding-db --format='get(ipAddresses[0].ipAddress)'

# 2. Authorized networks 확인
gcloud sql instances describe phoding-db --format='get(settings.ipConfiguration.authorizedNetworks)'

# 3. VM IP 확인
curl ifconfig.me
```

### 권한 오류: "permission denied for database"
```sql
-- postgres 사용자로 접속 후
GRANT ALL PRIVILEGES ON DATABASE phoding TO phoding;
```

### Prisma 마이그레이션 실패
```bash
# 1. 연결 문자열 확인
echo $DATABASE_URL

# 2. 수동으로 마이그레이션
cd /opt/phoding/gateway
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## 📚 참고 링크

- [Cloud SQL for PostgreSQL 문서](https://cloud.google.com/sql/docs/postgres)
- [Cloud SQL Proxy 가이드](https://cloud.google.com/sql/docs/postgres/connect-instance-auth-proxy)
- [Prisma with Cloud SQL](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-google-cloud)
