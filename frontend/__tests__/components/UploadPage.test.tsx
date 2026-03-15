import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadPage from '@/components/UploadPage';
import { analyzeImage } from '@/lib/api';
import type { AnalysisResult } from '@/lib/api';

// next/navigation mock
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

// analyzeImage mock
jest.mock('@/lib/api', () => ({
  analyzeImage: jest.fn(),
}));

const mockAnalyzeImage = analyzeImage as jest.MockedFunction<typeof analyzeImage>;

// 성공 응답 픽스처
const mockSuccessResult: AnalysisResult = {
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

describe('UploadPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  // T4-1: 초기 렌더링
  test('T4-1: 초기 렌더링 — 파일 선택 탭 활성화, 업로드 영역 표시', () => {
    render(<UploadPage />);

    // 타이틀 확인
    expect(screen.getByText('DrugCatch')).toBeInTheDocument();

    // 탭 버튼 확인
    expect(screen.getByText('파일 선택')).toBeInTheDocument();
    expect(screen.getByText('카메라 촬영')).toBeInTheDocument();

    // 파일 업로드 영역 확인
    expect(screen.getByText('파일을 선택하거나 드래그하세요')).toBeInTheDocument();
  });

  // T4-2: 유효한 이미지 파일 선택
  test('T4-2: 유효한 이미지 파일 선택 시 미리보기 및 분석 버튼 활성화', async () => {
    render(<UploadPage />);

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    // 미리보기 이미지 표시
    await waitFor(() => {
      expect(screen.getByAltText('선택한 이미지 미리보기')).toBeInTheDocument();
    });

    // "이미지 분석 시작" 버튼 활성화
    expect(screen.getByText('이미지 분석 시작')).not.toBeDisabled();
  });

  // T4-3: 허용되지 않는 파일 형식
  test('T4-3: 허용되지 않는 파일 형식 선택 시 에러 메시지 표시', async () => {
    render(<UploadPage />);

    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, HEIC만 가능)'
      );
    });
  });

  // T4-4: 10MB 초과 파일
  test('T4-4: 10MB 초과 파일 선택 시 에러 메시지 표시', async () => {
    render(<UploadPage />);

    // 11MB 더미 파일 생성
    const largeContent = new Uint8Array(11 * 1024 * 1024);
    const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        '파일 크기가 10MB를 초과합니다.'
      );
    });
  });

  // T4-5: "다시 선택" 버튼 클릭
  test('T4-5: "다시 선택" 버튼 클릭 시 미리보기 초기화', async () => {
    render(<UploadPage />);

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByAltText('선택한 이미지 미리보기')).toBeInTheDocument();
    });

    const resetButton = screen.getByText('다시 선택');
    await act(async () => {
      fireEvent.click(resetButton);
    });

    // 미리보기 사라짐
    expect(screen.queryByAltText('선택한 이미지 미리보기')).not.toBeInTheDocument();
    // 업로드 영역 다시 표시
    expect(screen.getByText('파일을 선택하거나 드래그하세요')).toBeInTheDocument();
  });

  // T4-6: 분석 중 로딩 상태
  test('T4-6: 분석 중 "분석 중..." 표시 및 버튼 비활성화', async () => {
    // 분석이 지연되도록 설정
    mockAnalyzeImage.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSuccessResult), 1000))
    );

    render(<UploadPage />);

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText('이미지 분석 시작')).toBeInTheDocument();
    });

    const analyzeButton = screen.getByText('이미지 분석 시작');
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('분석 중...')).toBeInTheDocument();
    });
  });

  // T4-7: 분석 성공 → 결과 페이지 라우팅
  test('T4-7: 분석 성공 시 sessionStorage 저장 후 /result로 이동', async () => {
    mockAnalyzeImage.mockResolvedValue(mockSuccessResult);

    render(<UploadPage />);

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText('이미지 분석 시작')).toBeInTheDocument();
    });

    const analyzeButton = screen.getByText('이미지 분석 시작');
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/result');
    });

    const stored = sessionStorage.getItem('analysisResult');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.status).toBe('success');
  });

  // T4-8: 분석 실패 (error status)
  test('T4-8: 분석 실패 시 에러 메시지 표시', async () => {
    mockAnalyzeImage.mockResolvedValue({
      status: 'error',
      message: '분석에 실패했습니다. 다시 시도해 주세요.',
    });

    render(<UploadPage />);

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText('이미지 분석 시작')).toBeInTheDocument();
    });

    const analyzeButton = screen.getByText('이미지 분석 시작');
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        '분석에 실패했습니다. 다시 시도해 주세요.'
      );
    });
  });
});
