'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, courses, type User, type Course } from '@/lib/api';

export default function CourseStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = auth.getUser();
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login');
      return;
    }

    loadData();
  }, [courseId, router]);

  const loadData = async () => {
    try {
      const [courseData, studentsData] = await Promise.all([
        courses.getById(courseId),
        courses.getStudents(courseId)
      ]);
      setCourse(courseData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar los datos');
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
            onClick={() => router.push('/teacher/dashboard')}
            className="text-indigo-600 hover:text-indigo-700 mb-3 flex items-center gap-2"
          >
            ← Back to dashboard
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4">
              <span className="text-5xl">👥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enrolled Students</h1>
              <p className="text-gray-600 mt-1">{course?.title}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Students</div>
            <div className="text-3xl font-bold text-indigo-600">{students.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Average progress</div>
            <div className="text-3xl font-bold text-green-600">0%</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active this week</div>
            <div className="text-3xl font-bold text-purple-600">-</div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              List of students ({students.length})
            </h2>
          </div>

          {students.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No students are enrolled yet
              </h3>
              <p className="text-gray-600">
                Students will be able to enroll when you publish the course
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <div key={student.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center">
                        <span className="text-xl">👤</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">Progreso</div>
                        <div className="text-sm text-gray-500">0%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">Inscrito</div>
                        <div className="text-sm text-gray-500">
                            {/* {new Date(student.created_at).toLocaleDateString()} */}
                            Recently
                        </div>
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