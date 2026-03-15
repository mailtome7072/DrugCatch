import { analyzeImage } from '@/lib/api';
import type { AnalysisResult } from '@/lib/api';

// 성공 응답 mock 데이터
const mockSuccessData: AnalysisResult = {
  status: 'success',
  data: {
    image_type: 'prescription',
    extracted_text: '타이레놀',
    drugs: [
      {
        drug_name: '타이레놀',
        generic_name: '아세트아미노펜',
        usage: '해열 진통',
        caution: '',
        dosage: '1일 3회',
        matched: true,
      },
    ],
    warnings: [],
  },
};

describe('analyzeImage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // T3-1: 정상 응답 (status: success)
  test('T3-1: 정상 응답 시 AnalysisResult 반환', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSuccessData,
    });

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const result = await analyzeImage(file);

    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    expect(result.data?.drugs).toHaveLength(1);
  });

  // T3-2: HTTP 4xx 에러
  test('T3-2: HTTP 4xx 에러 시 error status 반환', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: '잘못된 파일 형식입니다.' }),
    });

    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });
    const result = await analyzeImage(file);

    expect(result.status).toBe('error');
    expect(result.message).toBe('잘못된 파일 형식입니다.');
  });

  // T3-3: HTTP 5xx 에러
  test('T3-3: HTTP 5xx 에러 시 error status와 기본 메시지 반환', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const result = await analyzeImage(file);

    expect(result.status).toBe('error');
    expect(result.message).toBe('서버 오류 (HTTP 500)');
  });

  // T3-4: 네트워크 에러 (fetch 예외)
  test('T3-4: 네트워크 에러 시 예외 전파', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('네트워크 오류'));

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    await expect(analyzeImage(file)).rejects.toThrow('네트워크 오류');
  });

  // T3-5: FormData에 file 필드 포함 여부
  test('T3-5: FormData에 file 필드가 포함되어 전송됨', async () => {
    let capturedFormData: FormData | null = null;

    global.fetch = jest.fn().mockImplementation((url: string, init: RequestInit) => {
      capturedFormData = init.body as FormData;
      return Promise.resolve({
        ok: true,
        json: async () => mockSuccessData,
      });
    });

    const file = new File(['dummy content'], 'prescription.jpg', { type: 'image/jpeg' });
    await analyzeImage(file);

    expect(capturedFormData).not.toBeNull();
    const formDataFile = capturedFormData!.get('file');
    expect(formDataFile).not.toBeNull();
    expect((formDataFile as File).name).toBe('prescription.jpg');
  });
});
