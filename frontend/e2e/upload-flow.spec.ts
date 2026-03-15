import { test, expect } from '@playwright/test';
import path from 'path';

// 분석 성공 mock 응답 데이터
const mockSuccessResponse = {
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

test.describe('업로드 플로우', () => {
  // E2E-1: 페이지 접근 및 탭 표시
  test('E2E-1: 업로드 페이지 접근 시 파일 선택/카메라 촬영 탭 표시', async ({ page }) => {
    await page.goto('/upload');

    await expect(page.getByText('파일 선택')).toBeVisible();
    await expect(page.getByText('카메라 촬영')).toBeVisible();
    await expect(page.getByText('DrugCatch')).toBeVisible();
  });

  // E2E-2: 파일 업로드 → 미리보기 표시
  test('E2E-2: 유효한 이미지 파일 업로드 시 미리보기 및 분석 버튼 표시', async ({ page }) => {
    await page.goto('/upload');

    // 숨김 파일 input에 파일 설정
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('dummy jpeg content'),
    });

    // 미리보기 이미지 표시 확인
    await expect(page.getByAltText('선택한 이미지 미리보기')).toBeVisible();
    // 이미지 분석 시작 버튼 활성화 확인
    await expect(page.getByText('이미지 분석 시작')).toBeVisible();
    await expect(page.getByText('이미지 분석 시작')).not.toBeDisabled();
  });

  // E2E-3: 잘못된 파일 형식 (txt)
  test('E2E-3: 허용되지 않는 파일 형식 선택 시 에러 메시지 표시', async ({ page }) => {
    await page.goto('/upload');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('text content'),
    });

    await expect(
      page.getByText('지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, HEIC만 가능)')
    ).toBeVisible();
  });

  // E2E-4: 분석 API mock → 성공 후 결과 페이지 이동
  test('E2E-4: 분석 API mock 성공 시 /result 페이지로 이동', async ({ page }) => {
    // POST /analyze API 요청을 가로채서 mock 응답 반환
    await page.route('**/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSuccessResponse),
      });
    });

    await page.goto('/upload');

    // 파일 업로드
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'prescription.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('dummy jpeg content'),
    });

    // 미리보기 대기
    await expect(page.getByAltText('선택한 이미지 미리보기')).toBeVisible();

    // 분석 시작
    await page.getByText('이미지 분석 시작').click();

    // 결과 페이지로 이동 확인
    await expect(page).toHaveURL('/result');
  });
});
