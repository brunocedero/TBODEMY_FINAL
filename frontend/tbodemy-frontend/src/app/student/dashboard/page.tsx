'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, courses, enrollments, type Course, type Enrollment } from '@/lib/api';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingCourse, setEnrollingCourse] = useState<number | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = auth.getUser();
    if (!currentUser || currentUser.role !== 'student') {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [allCourses, myEnrollmentsData] = await Promise.all([
        courses.getAll(),
        enrollments.getMyEnrollments()
      ]);
      
      // Mostrar solo cursos publicados
      setAvailableCourses(allCourses.filter(c => c.is_published));
      setMyEnrollments(myEnrollmentsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = (courseId: number) => {
    return myEnrollments.some(e => e.course_id === courseId);
  };

  const handleEnroll = async (courseId: number) => {
    setEnrollingCourse(courseId);
    try {
      await enrollments.enroll(courseId);
      // Recargar enrollments
      const updatedEnrollments = await enrollments.getMyEnrollments();
      setMyEnrollments(updatedEnrollments);
      // Navegar al curso
      router.push(`/student/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error enrolling:', error);
      if (error.response?.status === 400) {
        alert('Ya estás inscrito en este curso');
      } else {
        alert('Error al inscribirse en el curso');
      }
    } finally {
      setEnrollingCourse(null);
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

  const enrolledCourses = availableCourses.filter(c => isEnrolled(c.id));
  const availableToEnroll = availableCourses.filter(c => !isEnrolled(c.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-indigo-600">Tbodemy</h1>
              <p className="text-sm text-gray-600">Panel de Estudiante</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/student/speaking')}
                className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 font-medium"
              >
                🎙️ Speaking Practice
              </button>
              <button
                onClick={() => router.push('/student/friends')}
                className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 font-medium"
              >
                👥 Amigos
              </button>
              <span className="text-gray-700">👋 {user?.name}</span>
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
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg text-white p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">¡Bienvenido a tu espacio de aprendizaje!</h2>
          <p className="text-indigo-100">Explora los cursos disponibles y empieza a mejorar tu inglés</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Cursos Inscritos</div>
            <div className="text-3xl font-bold text-indigo-600">{enrolledCourses.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Cursos Disponibles</div>
            <div className="text-3xl font-bold text-green-600">{availableToEnroll.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Lecciones Completadas</div>
            <div className="text-3xl font-bold text-gray-600">0</div>
          </div>
        </div>

        {/* My Enrolled Courses */}
        {enrolledCourses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📚 Mis Cursos</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-sm border-2 border-green-200 hover:border-green-400 transition overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-32 flex items-center justify-center relative">
                    <span className="text-6xl">📚</span>
                    <div className="absolute top-2 right-2 bg-white text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                      ✓ Inscrito
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description || 'Curso de inglés'}
                    </p>
                    
                    <button
                      onClick={() => router.push(`/student/courses/${course.id}`)}
                      className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      Continuar Curso →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Courses */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Descubre Más Cursos
          </h2>
          
          {availableToEnroll.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {enrolledCourses.length > 0 
                  ? '¡Estás inscrito en todos los cursos disponibles!'
                  : 'No hay cursos disponibles'}
              </h3>
              <p className="text-gray-600">
                {enrolledCourses.length > 0
                  ? 'Continúa aprendiendo en tus cursos actuales.'
                  : 'Los profesores aún no han publicado cursos. Vuelve pronto.'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableToEnroll.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-indigo-400 transition overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32 flex items-center justify-center">
                    <span className="text-6xl">📚</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description || 'Curso de inglés'}
                    </p>
                    
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingCourse === course.id}
                      className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enrollingCourse === course.id ? 'Inscribiendo...' : 'Inscribirse →'}
                    </button>
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