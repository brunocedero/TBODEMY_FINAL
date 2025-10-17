'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, courses, units, type Unit } from '@/lib/api';

export default function StudentCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<any>(null);
  const [courseUnits, setCourseUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="text-indigo-600 hover:text-indigo-700 mb-3 flex items-center gap-2"
          >
            ← Volver al inicio
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4">
              <span className="text-5xl">📚</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
              <p className="text-gray-600 mt-1">{course?.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-900">Tu Progreso</h3>
            <span className="text-sm text-gray-600">0% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-indigo-600 h-3 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>

        {/* Units List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📖 Unidades del Curso ({courseUnits.length})
          </h2>

          {courseUnits.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Este curso aún no tiene unidades
              </h3>
              <p className="text-gray-600">El profesor está preparando el contenido.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courseUnits.map((unit, index) => (
                <div
                  key={unit.id}
                  className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-indigo-400 transition overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-indigo-100 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {unit.title}
                          </h3>
                        </div>
                        
                        {unit.content && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {unit.content}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <span>📝</span> Lección
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🎧</span> Audio
                          </span>
                          <span className="flex items-center gap-1">
                            <span>✏️</span> Ejercicios
                          </span>
                        </div>

                        <button
                          onClick={() => router.push(`/student/courses/${courseId}/units/${unit.id}`)}
                          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
                        >
                          Comenzar Unidad →
                        </button>
                      </div>

                      <div className="text-center">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                          <span className="text-2xl">○</span>
                        </div>
                        <span className="text-xs text-gray-500">Pendiente</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}