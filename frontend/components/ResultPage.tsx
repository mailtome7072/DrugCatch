'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalysisResult, DrugInfo } from '@/lib/api';
import { inferDiseases, KEYWORD_MAP } from '@/lib/inferDiseases';

// 이미지 유형 배지 텍스트
const IMAGE_TYPE_LABEL: Record<string, string> = {
  prescription: '처방전',
  packaged_drug: '포장 약품',
  unknown: '불명',
};

// 이미지 유형 배지 색상
const IMAGE_TYPE_COLOR: Record<string, string> = {
  prescription: 'bg-blue-100 text-blue-700',
  packaged_drug: 'bg-green-100 text-green-700',
  unknown: 'bg-gray-100 text-gray-600',
};

function DrugCard({ drug }: { drug: DrugInfo }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-white overflow-hidden flex">
      {/* 좌측: 약품 이미지 */}
      <div className="w-28 shrink-0 bg-gray-50 flex items-center justify-center border-r border-blue-100 p-2">
        {drug.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={drug.image_url}
            alt={`${drug.drug_name} 이미지`}
            className="w-full h-auto object-contain max-h-24"
          />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        )}
      </div>

      {/* 우측: 약품 정보 */}
      <div className="flex-1 p-4 space-y-2 min-w-0">
        <div>
          <p className="font-semibold text-gray-900 truncate">{drug.drug_name}</p>
          {drug.generic_name && (
            <p className="text-xs text-gray-500 truncate">{drug.generic_name}</p>
          )}
        </div>
        {drug.usage && (
          <div>
            <span className="text-xs font-medium text-gray-400">용도</span>
            <p className="text-sm text-gray-700">{drug.usage}</p>
          </div>
        )}
        {drug.dosage && (
          <div>
            <span className="text-xs font-medium text-gray-400">용법</span>
            <p className="text-sm text-gray-700">{drug.dosage}</p>
          </div>
        )}
        {drug.caution && (
          <div>
            <span className="text-xs font-medium text-gray-400">주의사항</span>
            <p className="text-sm text-red-600">{drug.caution}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResult');
    if (!stored) {
      router.replace('/upload');
      return;
    }
    let parsed: AnalysisResult | null = null;
    try {
      parsed = JSON.parse(stored) as AnalysisResult;
    } catch {
      router.replace('/upload');
      return;
    }
    const data = parsed;
    // queueMicrotask로 래핑하여 effect 내 동기 setState 방지
    queueMicrotask(() => {
      setResult(data);
      setIsLoading(false);
    });
  }, [router]);

  const handleRestart = () => {
    sessionStorage.removeItem('analysisResult');
    router.push('/upload');
  };

  // 마운트 전 또는 리다이렉트 중에는 렌더링 방지
  if (isLoading || !result || !result.data) return null;

  const { data } = result;
  const diseases = inferDiseases(data.drugs);
  const matchedDrugs = data.drugs.filter((d) => d.matched);

  // 유추 병명과 연관된 usage 항목만 추출, 최대 4개
  const diseaseSet = new Set(diseases);
  const usageList = Array.from(
    new Set(
      matchedDrugs
        .flatMap((d) => d.usage.split(/[,、，]/).map((u) => u.trim()).filter(Boolean))
        .filter((u) =>
          Object.entries(KEYWORD_MAP).some(
            ([keyword, category]) => u.includes(keyword) && diseaseSet.has(category)
          )
        )
    )
  ).slice(0, 4);
  const imageTypeLabel = IMAGE_TYPE_LABEL[data.image_type] ?? '불명';
  const imageTypeColor = IMAGE_TYPE_COLOR[data.image_type] ?? 'bg-gray-100 text-gray-600';

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md mx-auto space-y-6">

        {/* 헤더 */}
        <div className="text-center space-y-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${imageTypeColor}`}>
            {imageTypeLabel}
          </span>
          <h1 className="text-2xl font-bold text-gray-900">분석 결과</h1>
        </div>

        {/* 인식된 약품 없을 때 */}
        {matchedDrugs.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500 text-sm">
            약품 정보를 추출하지 못했습니다.
          </div>
        )}

        {/* 섹션 1 — 유추 병명 */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">유추 병명</h2>
          {diseases.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {diseases.map((d) => (
                <span
                  key={d}
                  className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200"
                >
                  {d}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              충분한 약품 정보가 없어 병명을 유추하지 못했습니다.
            </p>
          )}
        </section>

        {/* 섹션 2 — 처방 목적/증상 (usage 있을 때만) */}
        {usageList.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">처방 목적 / 증상</h2>
            <ul className="list-disc list-inside space-y-1">
              {usageList.map((u) => (
                <li key={u} className="text-sm text-gray-700">{u}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 섹션 3 — 약품 카드 리스트 (matched=true만 표시) */}
        {matchedDrugs.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">처방 약품</h2>
            <div className="space-y-3">
              {matchedDrugs.map((drug, idx) => (
                <DrugCard key={idx} drug={drug} />
              ))}
            </div>
          </section>
        )}

        {/* 섹션 4 — 경고 (warnings 있을 때만) */}
        {data.warnings.length > 0 && (
          <section className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 text-xl mt-0.5">⚠️</span>
              <div>
                <h2 className="font-semibold text-yellow-800 mb-1">주의사항</h2>
                <ul className="list-disc list-inside space-y-1">
                  {data.warnings.map((w, idx) => (
                    <li key={idx} className="text-yellow-700 text-sm">{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 면책 안내 */}
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          본 결과는 참고용이며 반드시 의사·약사에게 최종 확인하세요.
        </p>

        {/* 다시 분석하기 버튼 */}
        <button
          onClick={handleRestart}
          className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          다시 분석하기
        </button>

      </div>
    </main>
  );
}
