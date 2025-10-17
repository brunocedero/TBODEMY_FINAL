'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, courses, units, audioSentences, quizzes, type Unit, type AudioSentence, type Quiz } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CourseEditorPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<any>(null);
  const [courseUnits, setCourseUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [courseId, router]);

  const loadData = async () => {
    try {
      const [courseData, unitsData] = await Promise.all([
        courses.getById(courseId),
        units.getByCourse(courseId),
      ]);
      setCourse(courseData);
      setCourseUnits(unitsData);
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="text-indigo-600 hover:text-indigo-700 mb-3 flex items-center gap-2"
          >
            ← Volver al dashboard
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
              <p className="text-gray-600 mt-1">{course?.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  previewMode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-indigo-600 border-2 border-indigo-600'
                }`}
              >
                {previewMode ? '✏️ Modo Edición' : '👁️ Vista Previa'}
              </button>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                course?.is_published 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {course?.is_published ? '✓ Publicado' : '📝 Borrador'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!previewMode ? (
          // Editor Mode
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                📚 Unidades ({courseUnits.length})
              </h2>
              <button
                onClick={() => setShowAddUnit(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
              >
                + Agregar Unidad
              </button>
            </div>

            {courseUnits.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="text-6xl mb-4">📖</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay unidades todavía</h3>
                <p className="text-gray-600 mb-6">Crea la primera unidad de tu curso</p>
                <button
                  onClick={() => setShowAddUnit(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Crear Primera Unidad
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {courseUnits.map((unit) => (
                  <UnitEditorCard key={unit.id} unit={unit} onUpdate={loadData} />
                ))}
              </div>
            )}
          </>
        ) : (
          // Preview Mode
          <StudentPreview courseUnits={courseUnits} />
        )}
      </main>

      {/* Add Unit Modal */}
      {showAddUnit && (
        <AddUnitModal
          courseId={courseId}
          order={courseUnits.length}
          onClose={() => setShowAddUnit(false)}
          onSuccess={() => {
            setShowAddUnit(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ==================== Custom Audio Player Component ====================
function AudioPlayer({ audio }: { audio: AudioSentence }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
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
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className={`
            relative w-14 h-14 rounded-full flex items-center justify-center
            transition-all duration-300 transform hover:scale-110
            ${isPlaying 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg' 
              : 'bg-gradient-to-r from-indigo-400 to-purple-500'
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
            <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-25"></div>
          )}
        </button>

        {/* Content and Progress */}
        <div className="flex-1">
          {/* Sentence Text */}
          <p className="text-gray-900 font-medium mb-2 line-clamp-1">
            {audio.sentence}
          </p>

          {/* Progress Bar */}
          <div className="relative">
            <div 
              className="h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-100 relative"
                style={{ width: `${progress}%` }}
              >
                {/* Animated glow at the end of progress */}
                {isPlaying && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Time Display */}
            <div className="flex justify-between mt-1 text-xs text-gray-500 select-none">
              <span>{formatTime((progress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Visual Sound Waves when playing */}
          {isPlaying && !isLoading && (
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-indigo-400 to-purple-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 12 + 8}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
              <span className="text-xs text-indigo-600 font-medium ml-2">Reproduciendo...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Simplified Audio Player for Editor View ====================
interface SimpleAudioPlayerProps {
  audio: AudioSentence & { order: number };
  onDelete: () => void;
  onOrderChange: (newOrder: number) => void;
}

function SimpleAudioPlayer({ audio, onDelete, onOrderChange }: SimpleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrl = `${API_URL}${audio.audio_path}`;

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('canplay', handleCanPlay);
    audioElement.addEventListener('waiting', handleWaiting);

    return () => {
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
        // Pause all other audio elements
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

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-all duration-200">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-4">
        {/* Order Input */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 font-medium">Orden:</span>
          <input
            type="number"
            min="0"
            value={audio.order}
            onChange={(e) => onOrderChange(parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Audio Icon & Play Button */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-200 transform hover:scale-110
            ${isPlaying 
              ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-md' 
              : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
            }
            ${isLoading ? 'opacity-50 cursor-wait' : 'hover:shadow-lg active:scale-95'}
          `}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Sentence Text */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-2xl">🎧</span>
          <p className="text-gray-700 font-medium">
            {audio.sentence}
          </p>
          {isPlaying && (
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full animate-pulse">
              ▶ Reproduciendo
            </span>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// ==================== Student Preview ====================
function StudentPreview({ courseUnits }: { courseUnits: Unit[] }) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [audios, setAudios] = useState<AudioSentence[]>([]);
  const [unitQuizzes, setUnitQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedUnit) {
      loadUnitContent(selectedUnit.id);
    }
  }, [selectedUnit]);

  const loadUnitContent = async (unitId: number) => {
    setLoading(true);
    try {
      const [audiosData, quizzesData] = await Promise.all([
        audioSentences.getByUnit(unitId),
        quizzes.getByUnit(unitId),
      ]);
      setAudios(audiosData);
      setUnitQuizzes(quizzesData);
    } catch (err) {
      console.error('Error loading content:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">👁️ Vista Previa del Estudiante</h2>
        <p className="text-indigo-100">Así verán los estudiantes tu curso</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 p-6">
        {/* Units List */}
        <div className="md:col-span-1">
          <h3 className="font-semibold text-gray-900 mb-4">Unidades</h3>
          <div className="space-y-2">
            {courseUnits.map((unit, index) => (
              <button
                key={unit.id}
                onClick={() => setSelectedUnit(unit)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedUnit?.id === unit.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                }`}
              >
                <div className="font-medium text-gray-900">
                  Unidad {index + 1}
                </div>
                <div className="text-sm text-gray-600">{unit.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Unit Content */}
        <div className="md:col-span-2">
          {!selectedUnit ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📖</div>
              <p>Selecciona una unidad para ver su contenido</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedUnit.title}
                </h3>
                {selectedUnit.content && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-gray-700 whitespace-pre-line">{selectedUnit.content}</p>
                  </div>
                )}
              </div>

              {/* Audio Content */}
              {audios.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    🎧 Práctica de Audio
                  </h4>
                  <div className="space-y-3">
                    {audios.map((audio) => (
                      <AudioPlayer key={audio.id} audio={audio} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quizzes */}
              {unitQuizzes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    ✏️ Ejercicios
                  </h4>
                  <div className="space-y-4">
                    {unitQuizzes.map((quiz) => (
                      <QuizPreview key={quiz.id} quiz={quiz} />
                    ))}
                  </div>
                </div>
              )}

              {audios.length === 0 && unitQuizzes.length === 0 && !selectedUnit.content && (
                <div className="text-center py-8 text-gray-500">
                  Esta unidad aún no tiene contenido
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Quiz Preview Component ====================
function QuizPreview({ quiz }: { quiz: Quiz }) {
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);

  const checkAnswer = () => {
    setShowResult(true);
  };

  const isCorrect = answer.toLowerCase().trim() === quiz.correct_answer.toLowerCase().trim();

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
      <p className="text-gray-900 mb-3 text-lg">
        {quiz.question.split('[').map((part, i) => {
          if (i === 0) return part;
          const [, after] = part.split(']');
          return (
            <span key={i}>
              <span className="inline-block w-32 border-b-2 border-indigo-500 mx-1"></span>
              {after}
            </span>
          );
        })}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setShowResult(false);
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Tu respuesta..."
        />
        <button
          onClick={checkAnswer}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          Verificar
        </button>
      </div>
      {showResult && (
        <div className={`mt-3 p-3 rounded-md ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {isCorrect ? '✓ ¡Correcto!' : `✗ Incorrecto. La respuesta correcta es: ${quiz.correct_answer}`}
        </div>
      )}
    </div>
  );
}

// ==================== Unit Editor Card ====================
function UnitEditorCard({ unit, onUpdate }: { unit: Unit; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [audios, setAudios] = useState<AudioSentence[]>([]);
  const [unitQuizzes, setUnitQuizzes] = useState<Quiz[]>([]);
  const [showAddContent, setShowAddContent] = useState(false);
  const [contentType, setContentType] = useState<'text' | 'audio' | 'quiz' | null>(null);

  useEffect(() => {
    if (expanded) {
      loadContent();
    }
  }, [expanded]);

  const loadContent = async () => {
    try {
      const [audiosData, quizzesData] = await Promise.all([
        audioSentences.getByUnit(unit.id),
        quizzes.getByUnit(unit.id),
      ]);
      setAudios(audiosData);
      setUnitQuizzes(quizzesData);
    } catch (err) {
      console.error('Error loading content:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta unidad y todo su contenido?')) return;
    try {
      await units.delete(unit.id);
      onUpdate();
    } catch (err) {
      alert('Error al eliminar la unidad');
    }
  };

  const handleReorder = async () => {
    try {
      await Promise.all(
        audios.map((audio) =>
          audioSentences.update(audio.id, { order: audio.order })
        )
      );
      
      await Promise.all(
        unitQuizzes.map((quiz) =>
          quizzes.update(quiz.id, { order: quiz.order })
        )
      );
      
      alert('✓ Orden actualizado correctamente');
      loadContent();
    } catch (err) {
      console.error('Error actualizando orden:', err);
      alert('Error al actualizar el orden');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              📖 Unidad {unit.order + 1}: {unit.title}
            </h3>
            {unit.content && (
              <p className="text-gray-600 text-sm line-clamp-2">{unit.content}</p>
            )}
            <div className="flex gap-4 mt-3 text-sm">
              <span className={`${unit.content ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                {unit.content ? '✓ Texto agregado' : '○ Sin texto'}
              </span>
              <span className="text-gray-600">
                🎧 {audios.length} audio{audios.length !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-600">
                ✏️ {unitQuizzes.length} ejercicio{unitQuizzes.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-4 py-2 text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 font-medium transition"
            >
              {expanded ? 'Ocultar ▲' : 'Editar ▼'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 border-2 border-red-300 rounded-lg hover:bg-red-50 transition"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="mb-6">
            <button
              onClick={() => setShowAddContent(!showAddContent)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
            >
              {showAddContent ? '✕ Cerrar' : '+ Agregar Contenido'}
            </button>
          </div>

          {showAddContent && (
            <div className="mb-6 grid grid-cols-3 gap-3">
              <button
                onClick={() => setContentType('text')}
                className={`p-4 rounded-lg border-2 transition ${
                  contentType === 'text'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="font-medium">Texto</div>
              </button>
              <button
                onClick={() => setContentType('audio')}
                className={`p-4 rounded-lg border-2 transition ${
                  contentType === 'audio'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-300 bg-white hover:border-green-300'
                }`}
              >
                <div className="text-2xl mb-2">🎤</div>
                <div className="font-medium">Audio</div>
              </button>
              <button
                onClick={() => setContentType('quiz')}
                className={`p-4 rounded-lg border-2 transition ${
                  contentType === 'quiz'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 bg-white hover:border-purple-300'
                }`}
              >
                <div className="text-2xl mb-2">❓</div>
                <div className="font-medium">Quiz</div>
              </button>
            </div>
          )}

          {contentType === 'text' && (
            <AddTextForm unit={unit} onSuccess={() => { 
              setContentType(null); 
              setShowAddContent(false);
              onUpdate();
              loadContent();
            }} />
          )}
          {contentType === 'audio' && (
            <AddAudioForm unit={unit} onSuccess={() => { 
              setContentType(null); 
              setShowAddContent(false);
              loadContent(); 
            }} />
          )}
          {contentType === 'quiz' && (
            <AddQuizForm unit={unit} onSuccess={() => { 
              setContentType(null); 
              setShowAddContent(false);
              loadContent(); 
            }} />
          )}

          <div className="space-y-3 mt-6">
            {unit.content && (
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200 flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">📝</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-2">Contenido de texto:</p>
                    <p className="text-gray-700 whitespace-pre-line">{unit.content}</p>
                  </div>
                </div>
              </div>
            )}

            {(audios.length > 1 || unitQuizzes.length > 1) && (
              <div className="bg-yellow-50 border-2 border-yellow-300 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-700 font-medium">💡 Cambia los números para reordenar</span>
                </div>
                <button
                  onClick={handleReorder}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Guardar Orden
                </button>
              </div>
            )}

            {audios.length > 0 && (
              <div className="space-y-2">
                {audios.map((audio, index) => (
                  <SimpleAudioPlayer
                    key={audio.id}
                    audio={{...audio, order: audio.order || 0}}
                    onDelete={async () => {
                      if (confirm('¿Eliminar este audio?')) {
                        await audioSentences.delete(audio.id);
                        loadContent();
                      }
                    }}
                    onOrderChange={(newOrder) => {
                      const newAudios = [...audios];
                      newAudios[index].order = newOrder;
                      setAudios(newAudios);
                    }}
                  />
                ))}
              </div>
            )}

            {unitQuizzes.length > 0 && (
              <div className="space-y-2">
                {unitQuizzes.map((quiz, index) => (
                  <div
                    key={quiz.id}
                    className="bg-white p-4 rounded-lg border-2 border-gray-200 flex items-center gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 font-medium">Orden:</span>
                      <input
                        type="number"
                        min="0"
                        value={quiz.order}
                        onChange={(e) => {
                          const newQuizzes = [...unitQuizzes];
                          newQuizzes[index].order = parseInt(e.target.value) || 0;
                          setUnitQuizzes(newQuizzes);
                        }}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="text-2xl">❓</span>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{quiz.question}</p>
                      <p className="text-sm text-green-600 mt-1">✓ Respuesta: {quiz.correct_answer}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('¿Eliminar este quiz?')) {
                          await quizzes.delete(quiz.id);
                          loadContent();
                        }
                      }}
                      className="text-red-600 hover:text-red-800 px-3 py-2 rounded hover:bg-red-50"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ==================== Add Unit Modal ====================
function AddUnitModal({ courseId, order, onClose, onSuccess }: any) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await units.create({ course_id: courseId, title, content, order });
      onSuccess();
    } catch (err) {
      alert('Error al crear la unidad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">📖 Nueva Unidad</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Título de la unidad *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Saludos y presentaciones"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Contenido introductorio (opcional)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Texto introductorio de la unidad..."
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
              {loading ? 'Creando...' : 'Crear Unidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== Add Text Form ====================
function AddTextForm({ unit, onSuccess }: any) {
  const [content, setContent] = useState(unit.content || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await units.update(unit.id, { content });
      unit.content = content; // Actualizar el objeto local
      onSuccess();
    } catch (err) {
      alert('Error al guardar el texto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border-2 border-blue-200 p-6 rounded-lg mb-6">
      <label className="block text-sm font-medium text-gray-900 mb-3">📝 Contenido de texto</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Escribe el contenido de la unidad aquí..."
        required
      />
      <div className="flex gap-2 mt-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Guardando...' : '💾 Guardar Texto'}
        </button>
        <p className="text-xs text-gray-600 flex items-center">
          El texto aparecerá en la lista después de guardar
        </p>
      </div>
    </form>
  );
}

// ==================== Add Audio Form ====================
function AddAudioForm({ unit, onSuccess }: any) {
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const audios = await audioSentences.getByUnit(unit.id);
      await audioSentences.create({
        unit_id: unit.id,
        sentence,
        order: audios.length,
      });
      setSentence('');
      onSuccess();
    } catch (err) {
      alert('Error al crear el audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-green-50 border-2 border-green-200 p-6 rounded-lg mb-6">
      <label className="block text-sm font-medium text-gray-900 mb-3">
        🎤 Frase en inglés (se generará el audio automáticamente con gTTS)
      </label>
      <input
        type="text"
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="Hello, how are you?"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-3 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
      >
        {loading ? 'Generando audio...' : '+ Agregar Audio'}
      </button>
    </form>
  );
}

// ==================== Add Quiz Form ====================
function AddQuizForm({ unit, onSuccess }: any) {
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const existingQuizzes = await quizzes.getByUnit(unit.id);
      await quizzes.create({
        unit_id: unit.id,
        quiz_type: 'fill_blank',
        question,
        correct_answer: correctAnswer,
        order: existingQuizzes.length,
      });
      setQuestion('');
      setCorrectAnswer('');
      onSuccess();
    } catch (err) {
      alert('Error al crear el quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-purple-50 border-2 border-purple-200 p-6 rounded-lg mb-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          ❓ Pregunta (usa [palabra] para indicar el espacio en blanco)
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="I [am] a student"
          required
        />
        <p className="text-xs text-gray-600 mt-2">Ejemplo: "Hello, my name [is] John" → el estudiante completará "is"</p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-900 mb-3">Respuesta correcta</label>
        <input
          type="text"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="am"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
      >
        {loading ? 'Creando...' : '+ Agregar Quiz'}
      </button>
    </form>
  );
}