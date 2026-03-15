import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ResultPage from '@/components/ResultPage';
import type { AnalysisResult, AnalysisData } from '@/lib/api';

// next/navigation mock
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

// AnalysisResult 픽스처 생성 헬퍼
function makeAnalysisResult(overrides?: Partial<AnalysisData>): AnalysisResult {
  return {
    status: 'success',
    data: {
      image_type: 'prescription',
      extracted_text: '타이레놀',
      drugs: [
        {
          drug_name: '타이레놀',
          generic_name: '아세트아미노펜',
          usage: '해열 진통',
          caution: '위장 장애 주의',
          dosage: '1일 3회',
          matched: true,
        },
      ],
      warnings: [],
      ...overrides,
    },
  };
}

// sessionStorage에 분석 결과 주입 헬퍼
function injectSessionStorage(result: AnalysisResult) {
  sessionStorage.setItem('analysisResult', JSON.stringify(result));
}

describe('ResultPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  // T5-1: sessionStorage 데이터 없을 때
  test('T5-1: sessionStorage 데이터 없을 때 /upload로 리다이렉트', async () => {
    render(<ResultPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/upload');
    });
  });

  // T5-2: 정상 데이터 렌더링 (처방전)
  test('T5-2: 정상 데이터 렌더링 — 처방전 배지 및 약품 카드 표시', async () => {
    injectSessionStorage(makeAnalysisResult());

    render(<ResultPage />);

    await waitFor(() => {
      expect(screen.getByText('처방전')).toBeInTheDocument();
    });

    expect(screen.getByText('분석 결과')).toBeInTheDocument();
    expect(screen.getByText('타이레놀')).toBeInTheDocument();
  });

  // T5-3: matched=true 약품만 카드 표시
  test('T5-3: matched=false 약품은 카드로 표시되지 않음', async () => {
    injectSessionStorage(
      makeAnalysisResult({
        drugs: [
          {
            drug_name: '타이레놀',
            generic_name: '아세트아미노펜',
            usage: '해열 진통',
            caution: '',
            dosage: '1일 3회',
            matched: true,
          },
          {
            drug_name: '미인식약품',
            generic_name: '',
            usage: '알 수 없음',
            caution: '',
            dosage: '',
            matched: false,
          },
        ],
      })
    );

    render(<ResultPage />);

    await waitFor(() => {
      expect(screen.getByText('타이레놀')).toBeInTheDocument();
    });

    // matched=false 약품은 표시되지 않음
    expect(screen.queryByText('미인식약품')).not.toBeInTheDocument();
  });

  // T5-4: 병명 유추 표시
  test('T5-4: inferDiseases 결과(유추 병명)가 태그로 표시됨', async () => {
    injectSessionStorage(makeAnalysisResult());

    render(<ResultPage />);

    await waitFor(() => {
      // 해열 진통 키워드 → 발열, 통증 유추
      expect(screen.getByText('발열')).toBeInTheDocument();
      expect(screen.getByText('통증')).toBeInTheDocument();
    });
  });

  // T5-5: 약품 카드 없을 때 빈 상태 메시지
  test('T5-5: matched=true 약품 없을 때 빈 상태 메시지 표시', async () => {
    injectSessionStorage(
      makeAnalysisResult({
        drugs: [
          {
            drug_name: '미인식약품',
            generic_name: '',
            usage: '',
            caution: '',
            dosage: '',
            matched: false,
          },
        ],
      })
    );

    render(<ResultPage />);

    await waitFor(() => {
      expect(screen.getByText('약품 정보를 추출하지 못했습니다.')).toBeInTheDocument();
    });
  });

  // T5-6: "다시 분석하기" 버튼 클릭
  test('T5-6: "다시 분석하기" 클릭 시 sessionStorage 삭제 후 /upload로 이동', async () => {
    injectSessionStorage(makeAnalysisResult());

    render(<ResultPage />);

    await waitFor(() => {
      expect(screen.getByText('다시 분석하기')).toBeInTheDocument();
    });

    const restartButton = screen.getByText('다시 분석하기');
    await act(async () => {
      fireEvent.click(restartButton);
    });

    expect(sessionStorage.getItem('analysisResult')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/upload');
  });
});
