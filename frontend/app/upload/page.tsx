import type { Metadata } from 'next';
import UploadPage from '@/components/UploadPage';

export const metadata: Metadata = {
  title: '이미지 업로드 | DrugCatch',
};

export default function UploadRoute() {
  return <UploadPage />;
}
