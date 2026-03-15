// 약품 정보 타입
export type DrugInfo = {
  drug_name: string;
  generic_name: string;
  usage: string;
  caution: string;
  dosage: string;
  matched: boolean;
  image_url?: string | null;
};

// 분석 데이터 타입
export type AnalysisData = {
  image_type: 'prescription' | 'packaged_drug' | 'unknown';
  extracted_text: string;
  drugs: DrugInfo[];
  warnings: string[];
};

// 분석 결과 타입
export type AnalysisResult = {
  status: 'success' | 'error';
  data?: AnalysisData;
  message?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * 이미지 분석 함수 — 백엔드 OCR API 호출
 */
export async function analyzeImage(file: File): Promise<AnalysisResult> {
  console.log('[analyzeImage] 분석 시작:', file.name, file.type, file.size);

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.detail ?? `서버 오류 (HTTP ${response.status})`;
    console.error('[analyzeImage] 오류:', message);
    return { status: 'error', message };
  }

  const result: AnalysisResult = await response.json();
  console.log('[analyzeImage] 분석 완료:', result);
  return result;
}
