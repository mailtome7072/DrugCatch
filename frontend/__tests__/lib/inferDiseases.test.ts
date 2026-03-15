import { inferDiseases, KEYWORD_MAP } from '@/lib/inferDiseases';
import type { DrugInfo } from '@/lib/api';

// DrugInfo 기본 픽스처 생성 헬퍼
function makeDrug(overrides: Partial<DrugInfo> = {}): DrugInfo {
  return {
    drug_name: '테스트약',
    generic_name: '',
    usage: '',
    caution: '',
    dosage: '',
    matched: true,
    ...overrides,
  };
}

describe('inferDiseases', () => {
  // T2-1: 빈 배열
  test('T2-1: 빈 배열 입력 시 빈 배열 반환', () => {
    expect(inferDiseases([])).toEqual([]);
  });

  // T2-2: matched=false 약품만 있을 때
  test('T2-2: matched=false 약품만 있을 때 빈 배열 반환', () => {
    const drugs = [
      makeDrug({ matched: false, usage: '해열 진통' }),
      makeDrug({ matched: false, usage: '고혈압' }),
      makeDrug({ matched: false, usage: '당뇨' }),
    ];
    expect(inferDiseases(drugs)).toEqual([]);
  });

  // T2-3: 단일 키워드 매핑
  test('T2-3: 해열 진통 키워드 → 발열, 통증 반환', () => {
    const drugs = [makeDrug({ usage: '해열 진통', matched: true })];
    const result = inferDiseases(drugs);
    expect(result).toContain('발열');
    expect(result).toContain('통증');
  });

  // T2-4: 중복 카테고리 제거
  test('T2-4: 동일 카테고리 키워드가 복수 약품에 있을 때 중복 없이 반환', () => {
    const drugs = [
      makeDrug({ usage: '해열', matched: true }),
      makeDrug({ usage: '해열 진통', matched: true }),
    ];
    const result = inferDiseases(drugs);
    // 발열은 한 번만 나와야 함
    const 발열Count = result.filter((d) => d === '발열').length;
    expect(발열Count).toBe(1);
  });

  // T2-5: 최대 5개 제한
  test('T2-5: 6개 이상 매핑 가능한 약품도 최대 5개 반환', () => {
    // 해열(발열), 진통(통증), 항생(세균성 감염), 고혈압(고혈압), 당뇨(당뇨병), 우울(우울증) — 6개
    const drugs = [
      makeDrug({ usage: '해열 진통 항생 고혈압 당뇨 우울', matched: true }),
    ];
    const result = inferDiseases(drugs);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  // T2-6: usage 없는 약품
  test('T2-6: usage가 빈 문자열인 matched=true 약품 → 빈 배열 반환', () => {
    const drugs = [makeDrug({ usage: '', matched: true })];
    expect(inferDiseases(drugs)).toEqual([]);
  });

  // T2-7: KEYWORD_MAP 키 정합성
  test('T2-7: KEYWORD_MAP의 모든 key와 value가 문자열', () => {
    for (const [key, value] of Object.entries(KEYWORD_MAP)) {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('string');
    }
  });
});
