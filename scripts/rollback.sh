#!/usr/bin/env bash
# rollback.sh — 지정한 커밋으로 git revert 후 master에 push하여 Render 자동 재배포를 트리거합니다.
#
# 사용법:
#   ./scripts/rollback.sh <되돌릴_커밋_해시>
#
# 예시:
#   ./scripts/rollback.sh abc1234
#
# 동작 방식:
#   1. 지정 커밋을 git revert (새 revert 커밋 생성)
#   2. master에 push → Render가 자동으로 새 커밋 기반으로 재배포
#   3. 헬스체크로 배포 완료 확인 (최대 3분 대기)

set -euo pipefail

COMMIT_HASH="${1:-}"
HEALTH_URL="https://drugcatch-backend.onrender.com/health"
MAX_WAIT=180   # 최대 대기 시간 (초)
INTERVAL=10    # 헬스체크 간격 (초)

# ── 입력 검증 ──────────────────────────────────────────────────────────────

if [[ -z "$COMMIT_HASH" ]]; then
  echo "❌ 사용법: $0 <되돌릴_커밋_해시>"
  echo ""
  echo "최근 커밋 목록:"
  git log --oneline master -10
  exit 1
fi

if ! git cat-file -e "${COMMIT_HASH}^{commit}" 2>/dev/null; then
  echo "❌ 유효하지 않은 커밋 해시: $COMMIT_HASH"
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "master" ]]; then
  echo "❌ master 브랜치에서 실행해야 합니다. 현재 브랜치: $CURRENT_BRANCH"
  echo "   git checkout master 후 다시 시도하세요."
  exit 1
fi

# ── 롤백 실행 ──────────────────────────────────────────────────────────────

COMMIT_MSG=$(git log --oneline -1 "$COMMIT_HASH")
echo ""
echo "🔄 롤백 대상 커밋: $COMMIT_MSG"
echo ""
read -r -p "위 커밋을 revert하고 master에 push하겠습니까? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "취소되었습니다."
  exit 0
fi

echo ""
echo "⏳ git revert 실행 중..."
git revert --no-edit "$COMMIT_HASH"

echo "⏳ master에 push 중..."
git push origin master

echo ""
echo "✅ Push 완료. Render 자동 재배포가 시작됩니다."
echo "   배포 상황: https://dashboard.render.com"
echo ""

# ── 헬스체크 대기 ──────────────────────────────────────────────────────────

echo "⏳ 배포 완료 대기 중 (최대 ${MAX_WAIT}초)..."
elapsed=0

while [[ $elapsed -lt $MAX_WAIT ]]; do
  sleep $INTERVAL
  elapsed=$((elapsed + INTERVAL))

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [[ "$STATUS" == "200" ]]; then
    echo ""
    echo "✅ 헬스체크 통과 (${elapsed}초 소요)"
    echo "   백엔드: $HEALTH_URL → HTTP $STATUS"
    echo ""
    echo "롤백 완료. 프론트엔드도 확인하세요:"
    echo "   https://drugcatch-frontend.onrender.com"
    exit 0
  fi

  echo "   대기 중... (${elapsed}s / ${MAX_WAIT}s) HTTP $STATUS"
done

echo ""
echo "⚠️  헬스체크 타임아웃 (${MAX_WAIT}초 초과)"
echo "   Render 대시보드에서 배포 상태를 직접 확인하세요:"
echo "   https://dashboard.render.com"
exit 1
