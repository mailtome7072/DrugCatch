'use client';

import { useState, useRef, useEffect } from 'react';
import { analyzeImage } from '@/lib/api';

// 허용 MIME 타입
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
// 최대 파일 크기: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type InputMode = 'camera' | 'file';

export default function UploadPage() {
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 카메라 관련 상태
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 미리보기 URL 메모리 누수 방지
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 카메라 스트림 정리
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // isCameraOpen + cameraStream 세팅 후 DOM 마운트 완료 시점에 srcObject 할당
  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [isCameraOpen, cameraStream]);

  // 카메라 열기 (getUserMedia)
  const openCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
      console.log('[UploadPage] 카메라 열림');
    } catch (err) {
      console.error('[UploadPage] 카메라 접근 오류:', err);
      setErrorMessage('카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.');
    }
  };

  // 카메라 닫기
  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  // 촬영 (canvas에 현재 프레임 캡처 → File 생성)
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        console.log('[UploadPage] 촬영 완료:', file.name, file.size);

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        closeCamera();
      },
      'image/jpeg',
      0.9,
    );
  };

  // 파일 유효성 검사 및 미리보기 설정
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[UploadPage] 파일 선택:', file.name, file.type, file.size);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn('[UploadPage] 유효성 실패: 지원하지 않는 파일 형식', file.type);
      setErrorMessage('지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, HEIC만 가능)');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      console.warn('[UploadPage] 유효성 실패: 파일 크기 초과', file.size);
      setErrorMessage('파일 크기가 10MB를 초과합니다.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // 미리보기 초기화
  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 분석 실행
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    console.log('[UploadPage] 분석 시작');
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await analyzeImage(selectedFile);
      console.log('[UploadPage] 분석 완료:', result);
      // Sprint 4에서 결과 화면으로 연결 예정
    } catch (err) {
      console.error('[UploadPage] 분석 오류:', err);
      setErrorMessage('분석 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 탭 전환 시 상태 초기화
  const handleTabChange = (mode: InputMode) => {
    if (mode === inputMode) return;
    closeCamera();
    handleReset();
    setInputMode(mode);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">DrugCatch</h1>
          <p className="mt-2 text-gray-600 text-sm">이미지를 업로드하여 복약정보를 조회하세요.</p>
        </div>

        {/* 탭 버튼 */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          <button
            onClick={() => handleTabChange('file')}
            disabled={isAnalyzing}
            className={`flex-1 py-3 text-sm font-semibold transition-colors
              ${inputMode === 'file' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            파일 선택
          </button>
          <button
            onClick={() => handleTabChange('camera')}
            disabled={isAnalyzing}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-l border-gray-200
              ${inputMode === 'camera' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            카메라 촬영
          </button>
        </div>

        {/* 숨김 파일 input (파일 탭 전용) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
        {/* canvas: capturePhoto에서 프레임 캡처용 (화면에 미표시) */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {/* 에러 메시지 */}
        {errorMessage && (
          <p className="text-red-600 text-sm text-center" role="alert">
            {errorMessage}
          </p>
        )}

        {/* 카메라 뷰파인더 */}
        {isCameraOpen && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-64 object-contain"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeCamera}
                className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium
                  hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={capturePhoto}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold
                  hover:bg-blue-700 transition-colors"
              >
                촬영
              </button>
            </div>
          </div>
        )}

        {/* 미리보기 영역 */}
        {!isCameraOpen && previewUrl && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="선택한 이미지 미리보기"
                className="max-h-64 w-full object-contain"
              />
            </div>
            <button
              onClick={handleReset}
              disabled={isAnalyzing}
              className="w-full py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium
                hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다시 선택
            </button>
          </div>
        )}

        {/* 이미지 선택 영역 (카메라/파일 미활성 상태) */}
        {!isCameraOpen && !previewUrl && (
          <button
            onClick={() => {
              if (inputMode === 'camera') {
                openCamera();
              } else {
                fileInputRef.current?.click();
              }
            }}
            disabled={isAnalyzing}
            className="w-full h-48 rounded-xl border-2 border-dashed border-gray-300 bg-white
              flex flex-col items-center justify-center gap-2 text-gray-500 text-sm
              hover:border-blue-400 hover:text-blue-500 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inputMode === 'camera' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span>카메라로 촬영하기</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span>파일을 선택하거나 드래그하세요</span>
              </>
            )}
          </button>
        )}

        {/* 분석 버튼 */}
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || isAnalyzing || isCameraOpen}
          className="w-full py-3 rounded-xl font-semibold text-white transition-colors
            bg-blue-600 hover:bg-blue-700
            disabled:bg-gray-300 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <svg
                className="animate-spin w-5 h-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              분석 중...
            </>
          ) : (
            '이미지 분석 시작'
          )}
        </button>
      </div>
    </main>
  );
}
