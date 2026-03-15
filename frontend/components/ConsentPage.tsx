'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConsentPage() {
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  const handleStart = () => {
    if (agreed) {
      router.push('/upload');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">DrugCatch</h1>
          <p className="mt-2 text-gray-600 text-sm">
            처방전 및 약품 사진으로 복약정보를 조회하는 서비스입니다.
          </p>
        </div>

        {/* 경고 카드 1: 개인정보/민감정보 */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-yellow-500 text-xl mt-0.5">⚠️</span>
            <div>
              <h2 className="font-semibold text-yellow-800 mb-1">개인정보 및 민감정보 안내</h2>
              <p className="text-yellow-700 text-sm leading-relaxed">
                업로드하는 처방전·약품 사진에는 성명, 생년월일, 질환명 등
                민감한 개인정보가 포함될 수 있습니다. 해당 정보는 복약정보
                조회 목적으로만 처리되며, 분석 후 즉시 삭제됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 경고 카드 2: 전문가 확인 안내 */}
        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl mt-0.5">🏥</span>
            <div>
              <h2 className="font-semibold text-red-800 mb-1">의료 정보 참고용 안내</h2>
              <p className="text-red-700 text-sm leading-relaxed">
                본 서비스가 제공하는 복약정보는 참고용이며, 의학적 진단이나
                치료를 대체할 수 없습니다. 복약 관련 결정은 반드시
                의사·약사 등 전문가와 상담하시기 바랍니다.
              </p>
            </div>
          </div>
        </div>

        {/* 동의 체크박스 */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
          />
          <span className="text-gray-700 text-sm">
            위 내용을 모두 읽고 동의합니다.
          </span>
        </label>

        {/* 분석 시작 버튼 */}
        <button
          onClick={handleStart}
          disabled={!agreed}
          className="w-full py-3 rounded-xl font-semibold text-white transition-colors
            bg-blue-600 hover:bg-blue-700
            disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          분석 시작
        </button>
      </div>
    </main>
  );
}
