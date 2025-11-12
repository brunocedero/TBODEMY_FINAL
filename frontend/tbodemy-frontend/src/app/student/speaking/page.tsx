'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, speaking, type SpeakingSession } from '@/lib/api';

export default function SpeakingDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SpeakingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'student') {
      router.push('/login');
      return;
    }
    loadSessions();
  }, [router]);

  const loadSessions = async () => {
    try {
      const data = await speaking.getMySessions();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => router.push('/student/dashboard')}
                className="text-indigo-600 hover:text-indigo-700 mb-2"
              >
                ← Volver al Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">🎙️ Speaking Practice</h1>
              <p className="text-sm text-gray-600">Practica conversación con IA</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
            >
              + Nueva Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎤</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes sesiones de speaking
            </h3>
            <p className="text-gray-600 mb-6">
              Crea tu primera sesión y empieza a practicar conversación en inglés
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
            >
              Crear Primera Sesión
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-indigo-400 transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">
                    {session.conversation_type === 'formal' && '👔'}
                    {session.conversation_type === 'informal' && '😊'}
                    {session.conversation_type === 'business' && '💼'}
                    {session.conversation_type === 'casual' && '☕'}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {session.is_active ? 'Activa' : 'Finalizada'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {session.topic}
                </h3>

                <div className="space-y-1 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Tipo:</strong> {session.conversation_type}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Nivel:</strong> {session.difficulty_level}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Creada:</strong>{' '}
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => router.push(`/student/speaking/${session.id}`)}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  {session.is_active ? 'Continuar →' : 'Ver Historial'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(sessionId) => {
            setShowCreateModal(false);
            router.push(`/student/speaking/${sessionId}`);
          }}
        />
      )}
    </div>
  );
}

// Modal Component
function CreateSessionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (sessionId: number) => void;
}) {
  const [topic, setTopic] = useState('');
  const [conversationType, setConversationType] = useState<'formal' | 'informal' | 'business' | 'casual'>('casual');
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const session = await speaking.createSession({
        topic,
        conversation_type: conversationType,
        difficulty_level: difficultyLevel,
      });
      onCreated(session.id);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error al crear la sesión');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Nueva Sesión de Speaking</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tema de conversación
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: Travel, Food, Technology..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de conversación
            </label>
            <select
              value={conversationType}
              onChange={(e) => setConversationType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="casual">Casual</option>
              <option value="informal">Informal</option>
              <option value="formal">Formal</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel de dificultad
            </label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}