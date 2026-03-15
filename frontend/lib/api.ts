// 분석 결과 타입 정의
export type AnalysisResult = {
  status: 'success' | 'error';
  data?: unknown;
  message?: string;
};

/**
 * 이미지 분석 함수 (Sprint 3에서 실제 OCR API로 교체 예정)
 * 현재는 2초 지연 후 성공 응답을 반환하는 stub
 */
export async function analyzeImage(file: File): Promise<AnalysisResult> {
  console.log('[analyzeImage] 분석 시작:', file.name, file.type, file.size);

  // Sprint 3 교체 예정: 실제 백엔드 OCR API 호출
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('[analyzeImage] 분석 완료');
  return { status: 'success' };
}
