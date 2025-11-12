
import Link from 'next/link';
import { Globe, BookOpen, Mic, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-10 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Globe className="h-8 w-8 text-indigo-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">Tbodemy</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-600 hover:text-indigo-600 transition">Features</Link>
            <Link href="#courses" className="text-gray-600 hover:text-indigo-600 transition">Courses</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-indigo-600 transition">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-indigo-600 font-semibold hover:text-indigo-700 transition"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-indigo-700 transition shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative pt-32 pb-24 lg:pt-48 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            The Fun and Effective Way to <span className="text-indigo-600">Learn a Language</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Join millions of learners worldwide. Our bite-sized lessons, backed by science, make learning easy and addictive.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-indigo-700 transition transform hover:scale-105 shadow-lg"
            >
              Start Learning for Free
            </Link>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-50 via-white to-white -z-10"></div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why You'll Love Learning with Tbodemy</h2>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Discover a new way of learning that's effective and engaging.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Bite-Sized Lessons</h3>
              <p className="text-gray-600">
                Fit language learning into your day with short, effective lessons you can complete on the go.
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mic className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Real-World Audio</h3>
              <p className="text-gray-600">
                Develop your listening skills with audio from native speakers, helping you understand natural conversation.
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Interactive Community</h3>
              <p className="text-gray-600">
                Practice with a global community of learners, get feedback, and make learning a social experience.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

