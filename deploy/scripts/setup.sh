#!/bin/bash
# ===========================================
# Travel Helper - EC2 초기 설정 스크립트
# ===========================================
# Ubuntu EC2에서 실행: sudo ./setup.sh

set -e

echo "=========================================="
echo " Travel Helper EC2 초기 설정"
echo "=========================================="

# Root 확인
if [ "$EUID" -ne 0 ]; then
    echo "sudo로 실행해주세요: sudo ./setup.sh"
    exit 1
fi

ACTUAL_USER=${SUDO_USER:-ubuntu}
PROJECT_DIR="/home/$ACTUAL_USER/wigtn-travel-helper"

echo ""
echo "1. 시스템 업데이트..."
apt-get update
apt-get upgrade -y

echo ""
echo "2. Docker 설치..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    usermod -aG docker $ACTUAL_USER
    systemctl enable docker
    echo "   Docker 설치 완료"
else
    echo "   Docker 이미 설치됨"
fi

echo ""
echo "3. Docker Compose 설치..."
if ! docker compose version &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "   Docker Compose 설치 완료"
else
    echo "   Docker Compose 이미 설치됨"
fi

echo ""
echo "4. Git 설치..."
apt-get install -y git curl

echo ""
echo "5. Swap 파일 생성 (1GB RAM용)..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "   Swap 2GB 생성 완료"
else
    echo "   Swap 이미 존재"
fi

echo ""
echo "=========================================="
echo " 설정 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo ""
echo "1. 로그아웃 후 다시 로그인 (Docker 권한 적용)"
echo "   exit"
echo ""
echo "2. 프로젝트 클론:"
echo "   git clone https://github.com/wigtn/wigtn-travel-helper.git"
echo "   cd wigtn-travel-helper"
echo ""
echo "3. 환경 설정:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "4. 실행 (환경별):"
echo "   # 개발서버"
echo "   docker compose -f docker/docker-compose.dev.yml up -d --build"
echo "   # 프로덕션"
echo "   docker compose -f docker/docker-compose.prod.yml up -d --build"
echo ""
echo "5. 상태 확인:"
echo "   docker compose -f docker/docker-compose.prod.yml ps"
echo "   docker compose -f docker/docker-compose.prod.yml logs -f api"
echo ""
echo "6. 배포 스크립트 사용:"
echo "   ./deploy/scripts/deploy.sh           # 프로덕션 배포"
echo "   ./deploy/scripts/deploy.sh --dev     # 개발서버 배포"
echo ""
