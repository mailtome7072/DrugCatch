import type { Metadata } from 'next';
import ResultPage from '@/components/ResultPage';

export const metadata: Metadata = {
  title: '분석 결과 | DrugCatch',
};

export default function ResultRoute() {
  return <ResultPage />;
}
