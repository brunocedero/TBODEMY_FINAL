'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, courses, units, audioSentences, quizzes, type Unit, type AudioSentence, type Quiz } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function StudentUnitPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.id);
  const unitId = Number(params.unitId);

  const [course, setCourse] = useState<any>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [audios, setAudios] = useState<AudioSentence[]>([]);
  const [unitQuizzes, setUnitQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadData();
  }, [unitId, router]);

  const loadData = async () => {
    try {
      const [courseData, unitData, audiosData, quizzesData] = await Promise.all([
        courses.getById(courseId),
        units.getById(unitId),
        audioSentences.getByUnit(unitId),
        quizzes.getByUnit(unitId),
      ]);
      
      setCourse(courseData);
      setUnit(unitData);
      setAudios(audiosData.sort((a: any, b: any) => a.order - b.order));
      setUnitQuizzes(quizzesData.sort((a: any, b: any) => a.order - b.order));
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push(`/student/courses/${courseId}`)}
            className="text-indigo-600 hover:text-indigo-700 mb-3 flex items-center gap-2"
          >
            ← Back to course
          </button>
          <div>
            <p className="text-sm text-gray-500 mb-1">{course?.title}</p>
            <h1 className="text-3xl font-bold text-gray-900">{unit?.title}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Text Content */}
          {unit?.content && (
            <section className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📝</span>
                <h2 className="text-2xl font-bold text-gray-900">Lesson content</h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {unit.content}
                </p>
              </div>
            </section>
          )}

          {/* Audio Section */}
          {audios.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🎧</span>
                <h2 className="text-2xl font-bold text-gray-900">Audio practice</h2>
              </div>
              <div className="space-y-4">
                {audios.map((audio, index) => (
                  <StyledAudioPlayer key={audio.id} audio={audio} index={index} />
                ))}
              </div>
            </section>
          )}

          {/* Quiz Section */}
          {unitQuizzes.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm border-2 border-purple-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">✏️</span>
                <h2 className="text-2xl font-bold text-gray-900">Practice exercises</h2>
              </div>
              <div className="space-y-6">
                {unitQuizzes.map((quiz, index) => (
                  <QuizComponent key={quiz.id} quiz={quiz} index={index} />
                ))}
              </div>
            </section>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8">
            <button
              onClick={() => router.push(`/student/courses/${courseId}`)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              ← Back to units
            </button>
            <button
              onClick={() => {
                // Here you could mark as completed and navigate to the next unit
                alert('Unit completed! 🎉');
                router.push(`/student/courses/${courseId}`);
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Mark as completed ✓
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ==================== Styled Audio Player Component ====================
function StyledAudioPlayer({ audio, index }: { audio: AudioSentence; index: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrl = `${API_URL}${audio.audio_path}`;

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
    };

    const handleTimeUpdate = () => {
      if (audioElement.duration) {
        setProgress((audioElement.currentTime / audioElement.duration) * 100);
        setCurrentTime(audioElement.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('canplay', handleCanPlay);
    audioElement.addEventListener('waiting', handleWaiting);

    return () => {
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('canplay', handleCanPlay);
      audioElement.removeEventListener('waiting', handleWaiting);
    };
  }, []);

  const togglePlayPause = async () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    try {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        // Pause all other audio elements on the page
        document.querySelectorAll('audio').forEach((audio) => {
          if (audio !== audioElement) {
            audio.pause();
          }
        });
        
        await audioElement.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audioElement = audioRef.current;
    if (!audioElement || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;

    audioElement.currentTime = newTime;
    setProgress(percentage * 100);
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReplay = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    audioElement.currentTime = 0;
    setProgress(0);
    setCurrentTime(0);
    audioElement.play();
    setIsPlaying(true);
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-start gap-4">
        {/* Number Badge */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-md">
          {index + 1}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Sentence Text */}
          <p className="text-lg font-medium text-gray-900 mb-4">{audio.sentence}</p>
          
          {/* Player Controls */}
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className={`
                relative w-14 h-14 rounded-full flex items-center justify-center
                transition-all duration-300 transform hover:scale-110
                ${isPlaying 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' 
                  : 'bg-gradient-to-r from-green-400 to-emerald-500'
                }
                ${isLoading ? 'opacity-50 cursor-wait' : 'hover:shadow-xl active:scale-95'}
                group
              `}
            >
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isPlaying ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}

              {/* Pulse animation when playing */}
              {isPlaying && !isLoading && (
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-25"></div>
              )}
            </button>

            {/* Progress Bar and Time */}
            <div className="flex-1">
              {/* Progress Bar */}
              <div className="relative mb-2">
                <div 
                  className="h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer group hover:h-3 transition-all duration-200"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-100 relative group-hover:shadow-lg"
                    style={{ width: `${progress}%` }}
                  >
                    {/* Animated glow at the end of progress */}
                    {isPlaying && (
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Display and Status */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  
                  {/* Status Indicator */}
                  {isPlaying && !isLoading && (
                    <div className="flex items-center gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-gradient-to-t from-green-400 to-emerald-500 rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 12 + 8}px`,
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '1.2s'
                          }}
                        />
                      ))}
                      <span className="text-xs text-green-600 font-medium ml-2">Playing</span>
                    </div>
                  )}
                </div>

                {/* Replay Button */}
                <button
                  onClick={handleReplay}
                  className="p-2 text-gray-500 hover:text-green-600 transition-colors hover:bg-green-50 rounded-lg"
                  title="Replay"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Practice Tip */}
            <div className="hidden lg:block">
              <div className="bg-white/70 backdrop-blur px-3 py-2 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 font-medium">
                  💡 Tip: Listen and repeat
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Quiz Component ====================
function QuizComponent({ quiz, index }: { quiz: Quiz; index: number }) {
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = () => {
    const correct = answer.toLowerCase().trim() === quiz.correct_answer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);
    setAttempts(attempts + 1);
  };

  const handleReset = () => {
    setAnswer('');
    setShowResult(false);
    setIsCorrect(false);
  };

  // Split the question into parts
  const renderQuestion = () => {
    const parts = quiz.question.split(/\[([^\]]+)\]/);
    return parts.map((part, i) => {
      if (i % 2 === 0) {
        // Normal text
        return <span key={i}>{part}</span>;
      } else {
        // Blank space
        return (
          <span key={i} className="inline-block mx-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setShowResult(false);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && answer.trim()) {
                  handleSubmit();
                }
              }}
              disabled={showResult && isCorrect}
              className={`px-4 py-2 border-2 rounded-lg text-center font-medium transition-all duration-200 ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-red-500 bg-red-50 text-red-800'
                  : 'border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'
              }`}
              placeholder="?"
              style={{ width: '150px' }}
            />
          </span>
        );
      }
    });
  };

  return (
    <div className={`rounded-xl p-6 border-2 transition-all duration-300 ${
      showResult
        ? isCorrect
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-md'
          : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300'
        : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 hover:shadow-md'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md ${
          showResult
            ? isCorrect
              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white animate-bounce'
              : 'bg-gradient-to-br from-red-500 to-red-600 text-white animate-pulse'
            : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
        }`}>
          {showResult && isCorrect ? '✓' : index + 1}
        </div>
        <div className="flex-1">
          <p className="text-lg font-medium text-gray-900 mb-4">
            {renderQuestion()}
          </p>

          {!showResult ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className={`
                  px-6 py-2.5 rounded-lg font-medium transition-all duration-200
                  ${answer.trim() 
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 transform hover:scale-105 shadow-md hover:shadow-lg' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Check answer
              </button>
              {attempts > 0 && (
                <span className="text-sm text-gray-500">
                  Attempts: {attempts}
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`p-4 rounded-lg transition-all duration-300 ${
                isCorrect 
                  ? 'bg-green-100 border border-green-300' 
                  : 'bg-red-100 border border-red-300'
              }`}>
                {isCorrect ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl animate-bounce">🎉</span>
                    <div>
                      <p className="font-semibold text-green-800">Correct! Great job.</p>
                      {attempts === 1 && (
                        <p className="text-sm text-green-600 mt-1">You got it on the first try!</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">😔</span>
                      <span className="font-semibold text-red-800">That&apos;s not correct</span>
                    </div>
                    <p className="text-sm text-red-700">
                      Your answer: <span className="font-medium line-through">{answer}</span>
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Correct answer: <span className="font-bold text-green-700">{quiz.correct_answer}</span>
                    </p>
                  </div>
                )}
              </div>
              
              {!isCorrect && (
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  🔄 Try again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
