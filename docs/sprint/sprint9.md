# Sprint 9 — 배포 문서화 보완 (배포 URL 명시, Render 접속 정보, 롤백 스크립트)

**기간**: 2026-03-16
**브랜치**: `sprint9`
**상태**: 완료 (2026-03-16)

---

## 목표

프로젝트 평가에서 지적된 세 가지 문서화 결함을 보완합니다.

1. 배포 URL(Render)이 저장소에 명시되지 않음
2. `docs/dev-process.md` 섹션 6.3 SSH 접속 정보가 TODO 상태
3. 롤백 절차 문서만 있고 실제 자동 롤백 스크립트 없음

---

## 변경 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `README.md` | 수정 | 배포 URL 섹션 추가 (프론트엔드/백엔드 Render URL), 설정 방법 Render 기준 업데이트 |
| `docs/dev-process.md` | 수정 | 섹션 6.2~6.4를 AWS Lightsail/SSH → Render 기준으로 전면 재작성 |
| `scripts/rollback.sh` | 신규 | git revert 기반 자동 롤백 스크립트 (헬스체크 대기 포함) |

---

## 배포 URL

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | https://drugcatch-frontend.onrender.com |
| 백엔드 API | https://drugcatch-backend.onrender.com |
| 헬스체크 | https://drugcatch-backend.onrender.com/health |

---

## 롤백 스크립트 (`scripts/rollback.sh`)

- `./scripts/rollback.sh <커밋_해시>` 실행
- 지정 커밋을 `git revert` → master push → Render 자동 재배포 트리거
- 헬스체크 엔드포인트 폴링으로 배포 완료 확인 (최대 3분 대기)

---

## 완료 기준

- ✅ README.md에 Render 배포 URL 명시
- ✅ `dev-process.md` 섹션 6.3 Render 기준으로 업데이트
- ✅ `scripts/rollback.sh` 생성 및 실행 권한 부여

---

## 회고 (Retrospective)

### 잘 된 점 (Keep)

- 평가 피드백을 구체적인 파일 변경으로 빠르게 반영
- 롤백 스크립트를 별도 파일로 분리하여 재사용 가능하게 구성
- 헬스체크 폴링으로 배포 완료 여부를 자동 확인하도록 구현

### 문제점 (Problem)

- AWS Lightsail 기준으로 작성된 문서가 오래 방치되어 Render 전환 시 불일치 발생
- 배포 플랫폼 전환(Lightsail → Render) 시 관련 문서를 즉시 업데이트하지 않은 기술 부채

### 개선 방향 (Try)

- 배포 플랫폼 변경 시 README, dev-process.md를 동일 커밋에서 함께 업데이트
- 롤백 스크립트는 Render API를 활용한 버전으로 추후 고도화 가능

### 핵심 학습 (Key Learnings)

- **배포 플랫폼 전환 시 문서 동기화가 코드만큼 중요**: Render URL, 접속 방법, 롤백 절차가 코드 변경과 함께 커밋되어야 평가자나 협업자가 혼란 없이 사용할 수 있다.
- **git revert 기반 롤백의 장점**: 이력이 보존되고 Render 자동 배포 파이프라인을 그대로 활용할 수 있어 별도 인프라 없이 구현 가능하다.
