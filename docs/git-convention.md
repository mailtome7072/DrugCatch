# Git 협업 규칙

> 브랜치 전략·커밋 메시지·PR 규칙의 단일 참조 문서.
> 개발 프로세스 상세는 docs/dev-process.md, CI/CD 정책은 docs/ci-policy.md 참조.

---

## 1. 브랜치 명명 규칙

| 브랜치 | 패턴 | 예시 |
|--------|------|------|
| 스프린트 개발 | sprint{n} | sprint1, sprint2 |
| 스테이징 통합 | develop | — |
| 프로덕션 | main | — |
| 긴급 패치 | hotfix/{설명} | hotfix/login-crash |

규칙:
- 소문자만 사용, 공백 대신 하이픈(-)
- sprint 브랜치는 develop 기반으로 분기
- hotfix 브랜치는 main 기반으로 분기 (develop 아님)

---

## 2. 커밋 메시지 규칙

형식: `type: 제목` (한국어, 50자 이내)

| type | 사용 시점 |
|------|-----------|
| feat | 새 기능 추가 |
| fix | 버그 수정 |
| docs | 문서 변경 |
| refactor | 기능 변경 없는 코드 개선 |
| test | 테스트 추가/수정 |
| chore | 빌드·설정 변경 |
| release | 버전 배포 |

예시:
```
feat: 사용자 동의 UI 레이아웃 구성
fix: 이미지 업로드 시 파일 형식 오류 수정
docs: setup-guide 환경변수 항목 보완
```

규칙:
- 본문이 필요할 때는 빈 줄 한 줄 후 작성
- 이슈 연결: 본문 하단에 `Closes #번호`
- Claude Code 생성 커밋에는 Co-Authored-By 태그 포함

---

## 3. PR 규칙

제목 형식 (에이전트별 자동 생성):
- 스프린트: `feat: Sprint {N} 완료 - {주요 목표}`
- 핫픽스:   `fix: {설명} (hotfix)`
- 배포:     `release: v{version} 프로덕션 배포`

본문 필수 항목:
- `## Summary` (변경 사항 bullet)
- `## Test plan` (검증 체크리스트)

---

## 4. 작업 흐름 요약

```
Sprint:  sprint{n} → PR to develop → 로컬 Docker 검증 → PR to main → 자동 배포
Hotfix:  hotfix/* → PR to main → 자동 배포 → develop 역머지
```

상세 절차: docs/dev-process.md
Hotfix vs Sprint 판단 기준: docs/dev-process.md 섹션 2
