#!/bin/bash
# ===========================================
# Travel Helper - 배포 스크립트
# ===========================================
# 사용법:
#   ./deploy.sh           # 프로덕션 배포
#   ./deploy.sh --dev     # 개발서버 배포
#   ./deploy.sh --pull    # git pull 후 배포
set -e

# 프로젝트 디렉토리 (git clone 위치)
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/wigtn-travel-helper}"
DATE=$(date +%Y%m%d_%H%M%S)

# 환경 설정 (기본: production)
ENV="prod"
ENV_FILE=".env.prod"
COMPOSE_FILE="docker/docker-compose.prod.yml"

# 인자 처리
for arg in "$@"; do
    case $arg in
        --dev)
            ENV="dev"
            ENV_FILE=".env.dev"
            COMPOSE_FILE="docker/docker-compose.dev.yml"
            ;;
        --pull)
            DO_PULL=true
            ;;
    esac
done

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "=== Travel Helper 배포 시작 (환경: $ENV) ==="

cd $DEPLOY_DIR

# .env 파일 확인
if [ ! -f $ENV_FILE ]; then
    log "ERROR: $ENV_FILE 파일이 없습니다."
    log "cp .env.${ENV}.example $ENV_FILE 후 값을 설정해주세요."
    exit 1
fi

# 환경변수 로드
source $ENV_FILE

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
if [ "$DO_PULL" = true ]; then
    log "최신 코드 가져오는 중..."
    git pull origin main
fi

# 이미지 빌드 및 컨테이너 재시작
log "Docker 이미지 빌드 중..."
docker compose --env-file $ENV_FILE -f $COMPOSE_FILE build

log "컨테이너 재시작 중..."
docker compose --env-file $ENV_FILE -f $COMPOSE_FILE down
docker compose --env-file $ENV_FILE -f $COMPOSE_FILE up -d

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
    docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs --tail 50 api
fi

# 오래된 이미지 정리
log "오래된 이미지 정리 중..."
docker image prune -af --filter "until=24h" 2>/dev/null || true

log "=== 배포 완료 ==="
log ""
log "서비스 상태:"
docker compose --env-file $ENV_FILE -f $COMPOSE_FILE ps
log ""
log "로그 확인: docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs -f api"
