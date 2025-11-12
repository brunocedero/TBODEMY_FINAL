'use client';

import { useParams } from 'next/navigation';
import SpeakingSession from '@/app/components/SpeakingSession';
import { useRouter } from 'next/navigation';

export default function SpeakingSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.id as string);

  const handleSessionEnd = () => {
    router.push('/student/speaking');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <SpeakingSession sessionId={sessionId} onEnd={handleSessionEnd} />
      </div>
    </div>
  );
}