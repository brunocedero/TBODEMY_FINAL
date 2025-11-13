'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, courses, type Course } from '@/lib/api';

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Verificar autenticación
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = auth.getUser();
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    loadCourses();
  }, [router]);

  const loadCourses = async () => {
    try {
      const data = await courses.getMyCourses();
      setMyCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
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
              <h1 className="text-2xl font-bold text-indigo-600">Tbodemy</h1>
              <p className="text-sm text-gray-600">Panel de Profesor</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total de Cursos</div>
            <div className="text-3xl font-bold text-indigo-600">{myCourses.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Publicados</div>
            <div className="text-3xl font-bold text-green-600">
              {myCourses.filter(c => c.is_published).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Borradores</div>
            <div className="text-3xl font-bold text-gray-600">
              {myCourses.filter(c => !c.is_published).length}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mis Cursos</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium"
          >
            + Crear Curso
          </button>
        </div>

        {/* Courses List */}
        {myCourses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No tienes cursos todavía</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Crear tu primer curso
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onUpdate={loadCourses}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal para crear curso */}
      {showModal && (
        <CreateCourseModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadCourses();
          }}
        />
      )}
    </div>
  );
}

// ==================== Componente CourseCard ====================
function CourseCard({ course, onUpdate }: { course: Course; onUpdate: () => void }) {
  const router = useRouter();
  const [studentCount, setStudentCount] = useState<number>(0);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    loadStudentCount();
  }, [course.id]);

  const loadStudentCount = async () => {
    try {
      const students = await courses.getStudents(course.id);
      setStudentCount(students.length);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudentCount(0);
    } finally {
      setLoadingStudents(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('¿Eliminar este curso?')) return;
    
    try {
      await courses.delete(course.id);
      onUpdate();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const handleTogglePublish = async () => {
    try {
      await courses.update(course.id, { is_published: !course.is_published });
      onUpdate();
    } catch (err) {
      alert('Error al actualizar');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
        <span className={`px-2 py-1 text-xs rounded ${
          course.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {course.is_published ? 'Publicado' : 'Borrador'}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {course.description || 'Sin descripción'}
      </p>

      {/* Contador de estudiantes */}
      <div className="mb-4 flex items-center gap-2 text-sm text-indigo-600">
        <span>👥</span>
        <span className="font-medium">
          {loadingStudents ? '...' : `${studentCount} estudiante${studentCount !== 1 ? 's' : ''}`}
        </span>
      </div>
      
      <div className="space-y-2">
        {/* Primera fila de botones */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/teacher/courses/${course.id}`)}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => router.push(`/teacher/courses/${course.id}/students`)}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
          >
            👥 Estudiantes
          </button>
        </div>

        {/* Segunda fila de botones */}
        <div className="flex gap-2">
          <button
            onClick={handleTogglePublish}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            {course.is_published ? '👁️ Despublicar' : '📢 Publicar'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 text-sm"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Modal para Crear Curso ====================
function CreateCourseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await courses.create({ title, description });
      onSuccess();
    } catch (err) {
      setError('Error al crear el curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Crear Nuevo Curso</h2>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del Curso *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Inglés para Principiantes"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe tu curso..."
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}