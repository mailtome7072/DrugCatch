import type { DrugInfo } from '@/lib/api';

// usage 키워드 → 질환 카테고리 매핑 테이블
export const KEYWORD_MAP: Record<string, string> = {
  해열: '발열',
  진통: '통증',
  소염: '염증',
  항생: '세균성 감염',
  세균: '세균성 감염',
  감염: '세균성 감염',
  고혈압: '고혈압',
  혈압: '고혈압',
  당뇨: '당뇨병',
  혈당: '당뇨병',
  인슐린: '당뇨병',
  우울: '우울증',
  불안: '불안장애',
  수면: '불면증',
  불면: '불면증',
  위산: '위식도역류질환',
  역류: '위식도역류질환',
  위염: '위염',
  소화: '소화불량',
  변비: '변비',
  설사: '설사',
  알레르기: '알레르기',
  항히스타민: '알레르기',
  천식: '천식',
  기관지: '기관지염',
  콜레스테롤: '고지혈증',
  고지혈: '고지혈증',
  갑상선: '갑상선 질환',
  골다공증: '골다공증',
  관절: '관절염',
  통풍: '통풍',
  간질: '뇌전증',
  뇌전증: '뇌전증',
  편두통: '편두통',
  두통: '두통',
  빈혈: '빈혈',
  철분: '빈혈',
};

/**
 * matched=true 약품의 usage 키워드를 분석하여 질환 카테고리를 추론합니다.
 * 중복 제거 후 최대 5개 반환합니다.
 */
export function inferDiseases(drugs: DrugInfo[]): string[] {
  const matchedDrugs = drugs.filter((d) => d.matched);
  const resultSet = new Set<string>();

  for (const drug of matchedDrugs) {
    if (!drug.usage) continue;
    for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
      if (drug.usage.includes(keyword)) {
        resultSet.add(category);
        if (resultSet.size >= 5) break;
      }
    }
    if (resultSet.size >= 5) break;
  }

  return Array.from(resultSet);
}
