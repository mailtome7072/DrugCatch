import { test, expect } from '@playwright/test';

// 결과 페이지에 주입할 mock 분석 결과 데이터
const mockAnalysisResult = {
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
  },
};

test.describe('결과 페이지', () => {
  // E2E-5: sessionStorage 없이 직접 접근 → /upload 리다이렉트
  test('E2E-5: sessionStorage 없이 /result 접근 시 /upload로 리다이렉트', async ({ page }) => {
    // sessionStorage를 비운 채로 이동
    await page.goto('/result');

    // /upload로 리다이렉트 확인
    await expect(page).toHaveURL('/upload');
  });

  // E2E-6: 정상 결과 데이터 → 결과 화면 렌더링
  test('E2E-6: 정상 분석 결과 데이터로 약품 카드 및 병명 태그 표시', async ({ page }) => {
    // 페이지 로드 전 sessionStorage에 분석 결과 주입
    await page.addInitScript((data) => {
      sessionStorage.setItem('analysisResult', JSON.stringify(data));
    }, mockAnalysisResult);

    await page.goto('/result');

    // 결과 페이지 콘텐츠 확인
    await expect(page.getByText('분석 결과')).toBeVisible();
    await expect(page.getByText('처방전')).toBeVisible();
    await expect(page.getByText('타이레놀')).toBeVisible();

    // 병명 유추 태그 확인 (해열 진통 → 발열, 통증)
    await expect(page.getByText('발열')).toBeVisible();
    await expect(page.getByText('통증')).toBeVisible();
  });

  // E2E-7: "다시 분석하기" 클릭 → /upload로 복귀
  test('E2E-7: "다시 분석하기" 버튼 클릭 시 /upload로 복귀', async ({ page }) => {
    // sessionStorage에 분석 결과 주입
    await page.addInitScript((data) => {
      sessionStorage.setItem('analysisResult', JSON.stringify(data));
    }, mockAnalysisResult);

    await page.goto('/result');

    // 결과 페이지 로드 대기
    await expect(page.getByText('다시 분석하기')).toBeVisible();

    // 버튼 클릭
    await page.getByText('다시 분석하기').click();

    // /upload로 이동 확인
    await expect(page).toHaveURL('/upload');
  });
});
