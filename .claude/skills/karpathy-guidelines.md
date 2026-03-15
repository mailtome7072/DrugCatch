# karpathy-guidelines 스킬

Andrej Karpathy의 소프트웨어 개발 철학을 바탕으로 한 코드 작성 지침입니다.
이 프로젝트의 모든 sprint/hotfix 구현에 적용합니다.

---

## 핵심 원칙

### 1. 단순함 우선 (Simplicity First)

- 복잡한 추상화보다 직접적이고 읽기 쉬운 코드를 선호합니다.
- 같은 로직을 3번 반복하기 전에는 추상화하지 않습니다.
- "영리한" 코드보다 "명백한" 코드를 작성합니다.

```python
# 나쁨: 과도한 추상화
class DataProcessorFactory:
    def create(self, type): ...

# 좋음: 직접적
def process_prescription(image): ...
def process_pill_photo(image): ...
```

### 2. 최소 코드 (Minimal Code)

- 요청된 기능만 구현합니다. 미래를 위한 코드를 미리 작성하지 않습니다.
- 사용되지 않는 코드, 주석 처리된 코드는 즉시 삭제합니다.
- 설정 가능성(configurability)을 미리 추가하지 않습니다.

### 3. 데이터 중심 사고 (Data-Centric Thinking)

- 코드 구조보다 데이터의 흐름을 먼저 설계합니다.
- 입력 → 변환 → 출력의 흐름을 명확히 합니다.
- 이 프로젝트: `이미지 → OCR 텍스트 → 파싱된 구조 → 결과 화면`

### 4. 작은 단위로 검증 (Verify in Small Steps)

- 큰 기능을 한 번에 구현하지 않습니다.
- 각 단계를 독립적으로 테스트 가능하게 구현합니다.
- 로컬에서 직접 실행하여 눈으로 확인합니다.

### 5. 의존성 최소화 (Minimize Dependencies)

- 새 라이브러리 추가는 신중하게 결정합니다.
- 표준 라이브러리나 이미 포함된 패키지로 해결 가능한지 먼저 확인합니다.
- 추가 전 `package.json` / `requirements.txt` 검토 필수.

---

## 구현 시 체크리스트

코드를 작성하기 전:
- [ ] 이 기능이 지금 당장 필요한가? (YAGNI: You Aren't Gonna Need It)
- [ ] 가장 단순한 구현 방법은 무엇인가?
- [ ] 새 의존성 없이 구현할 수 있는가?

코드를 작성한 후:
- [ ] 이 코드를 처음 보는 사람이 5분 안에 이해할 수 있는가?
- [ ] 불필요한 추상화 레이어가 없는가?
- [ ] 사용되지 않는 코드가 없는가?

---

## 이 프로젝트에서의 적용

MVP 단계이므로 특히 아래를 준수합니다:

- **DB 없음**: 정적 JSON 또는 공공 API를 직접 사용. ORM, 마이그레이션 불필요.
- **백엔드 단순화**: Express 라우터 레벨에서 직접 처리. 복잡한 레이어 불필요.
- **프론트엔드 단순화**: 상태 관리 라이브러리(Redux 등) 추가 금지. React useState/useEffect로 충분.
- **OCR 모듈**: 외부 API 우선 검토. 자체 구축은 MVP 이후.
