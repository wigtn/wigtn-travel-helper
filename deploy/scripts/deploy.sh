#!/bin/bash
# ===========================================
# Travel Helper - 배포 스크립트
# ===========================================
set -e

# 프로젝트 디렉토리 (git clone 위치)
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/wigtn-travel-helper}"
DATE=$(date +%Y%m%d_%H%M%S)

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "=== Travel Helper 배포 시작 ==="

cd $DEPLOY_DIR

# .env 파일 확인
if [ ! -f .env ]; then
    log "ERROR: .env 파일이 없습니다."
    log "cp .env.example .env 후 값을 설정해주세요."
    exit 1
fi

# 환경변수 로드
source .env

# 필수 변수 확인
if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "your_password_here" ]; then
    log "ERROR: POSTGRES_PASSWORD가 설정되지 않았습니다."
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [[ "$JWT_SECRET" == *"change-this"* ]]; then
    log "ERROR: JWT_SECRET이 설정되지 않았습니다."
    exit 1
fi

# Git pull (선택)
if [ "$1" = "--pull" ]; then
    log "최신 코드 가져오는 중..."
    git pull origin feature/devops
fi

# 이미지 빌드 및 컨테이너 재시작
log "Docker 이미지 빌드 중..."
docker-compose -f docker/docker-compose.yml build

log "컨테이너 재시작 중..."
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d

# Health check
log "API 상태 확인 중..."
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log "API 정상 작동!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "대기 중... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log "WARNING: API health check 실패. 로그를 확인하세요."
    docker-compose -f docker/docker-compose.yml logs --tail 50 api
fi

# 오래된 이미지 정리
log "오래된 이미지 정리 중..."
docker image prune -af --filter "until=24h" 2>/dev/null || true

log "=== 배포 완료 ==="
log ""
log "서비스 상태:"
docker-compose -f docker/docker-compose.yml ps
log ""
log "로그 확인: docker-compose -f docker/docker-compose.yml logs -f api"
