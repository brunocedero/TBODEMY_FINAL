import Link from 'next/link';
import { Globe, BookOpen, Mic, Users, CheckCircle, TrendingUp, Award, Zap, Clock, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-sm shadow-sm py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Globe className="h-8 w-8 text-indigo-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">Tbodemy</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-600 hover:text-indigo-600 transition font-medium">Features</Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-indigo-600 transition font-medium">How It Works</Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-indigo-600 transition font-medium">Testimonials</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-indigo-600 transition font-medium">Pricing</Link>
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
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4 mr-2" />
              Trusted by 500,000+ learners worldwide
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
              Master Any Language<br />
              <span className="text-indigo-600">The Smart Way</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Scientifically-proven methods meet engaging lessons. Learn faster, remember longer, and actually enjoy the process.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                href="/register"
                className="bg-indigo-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-indigo-700 transition transform hover:scale-105 shadow-lg"
              >
                Start Learning for Free
              </Link>
              <Link
                href="#how-it-works"
                className="bg-white text-indigo-600 border-2 border-indigo-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-indigo-50 transition"
              >
                See How It Works
              </Link>
            </div>
            <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-white -z-10"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      </main>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">500K+</div>
              <div className="text-gray-600 font-medium">Active Learners</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">25+</div>
              <div className="text-gray-600 font-medium">Languages</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">4.8★</div>
              <div className="text-gray-600 font-medium">Average Rating</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">95%</div>
              <div className="text-gray-600 font-medium">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with proven learning methods to give you the best experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Bite-Sized Lessons</h3>
              <p className="text-gray-600 leading-relaxed">
                5-10 minute lessons designed to fit your busy schedule. Learn during your commute, lunch break, or before bed.
              </p>
            </div>
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Mic className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Native Speaker Audio</h3>
              <p className="text-gray-600 leading-relaxed">
                Immerse yourself in authentic pronunciation and natural conversation from day one with our native speakers.
              </p>
            </div>
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Global Community</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with millions of learners worldwide. Practice together, share tips, and stay motivated.
              </p>
            </div>
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="bg-yellow-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Personalized Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                AI-powered algorithms adapt to your learning style and pace, ensuring optimal progress every day.
              </p>
            </div>
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Certified Courses</h3>
              <p className="text-gray-600 leading-relaxed">
                Earn certificates recognized by employers and educational institutions worldwide upon completion.
              </p>
            </div>
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Offline Mode</h3>
              <p className="text-gray-600 leading-relaxed">
                Download lessons and practice anywhere, anytime. No internet connection required once downloaded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How Tbodemy Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start speaking a new language in just 4 simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center relative">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Choose Your Language</h3>
              <p className="text-gray-600">
                Select from 25+ languages and set your learning goals based on your needs.
              </p>
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-indigo-300"></div>
            </div>
            <div className="text-center relative">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Take a Quick Test</h3>
              <p className="text-gray-600">
                We'll assess your current level and create a personalized learning path just for you.
              </p>
              <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-indigo-300 to-indigo-300"></div>
            </div>
            <div className="text-center relative">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Learn Daily</h3>
              <p className="text-gray-600">
                Complete bite-sized lessons daily and watch your progress grow with our streak system.
              </p>
              <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-indigo-300 to-indigo-300"></div>
            </div>
            <div className="text-center">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                4
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Achieve Fluency</h3>
              <p className="text-gray-600">
                Master real conversations, earn your certificate, and unlock new opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What Our Learners Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of successful language learners who transformed their lives with Tbodemy
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-md">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "I went from zero to holding basic conversations in Spanish in just 3 months! The bite-sized lessons fit perfectly into my busy schedule."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  SM
                </div>
                <div>
                  <div className="font-bold text-gray-900">Sarah Mitchell</div>
                  <div className="text-sm text-gray-500">Marketing Manager, USA</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "As someone who tried multiple apps, Tbodemy stands out. The community support and personalized lessons make all the difference."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  JC
                </div>
                <div>
                  <div className="font-bold text-gray-900">James Chen</div>
                  <div className="text-sm text-gray-500">Software Engineer, Canada</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "Learning French has always been my dream. Tbodemy made it achievable and fun. I passed my B2 exam with confidence!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  MR
                </div>
                <div>
                  <div className="font-bold text-gray-900">Maria Rodriguez</div>
                  <div className="text-sm text-gray-500">Teacher, Spain</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that works best for you. All plans include access to all languages.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Limited lessons per day</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Access to 1 language</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Basic progress tracking</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center bg-gray-100 text-gray-900 py-3 rounded-full font-semibold hover:bg-gray-200 transition"
              >
                Get Started
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-8 shadow-2xl transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">$9.99</span>
                <span className="text-indigo-100">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3 flex-shrink-0" />
                  <span>Unlimited lessons</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3 flex-shrink-0" />
                  <span>All 25+ languages</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3 flex-shrink-0" />
                  <span>Offline mode</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3 flex-shrink-0" />
                  <span>No ads</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3 flex-shrink-0" />
                  <span>Advanced progress analytics</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center bg-white text-indigo-600 py-3 rounded-full font-semibold hover:bg-gray-50 transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Family Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Family</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$14.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Everything in Premium</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Up to 6 family members</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Individual profiles</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Family progress dashboard</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center bg-gray-100 text-gray-900 py-3 rounded-full font-semibold hover:bg-gray-200 transition"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Language Journey?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 leading-relaxed">
            Join over 500,000 learners worldwide. Start speaking a new language today with our 14-day free trial.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-indigo-600 px-12 py-4 rounded-full text-lg font-bold hover:bg-gray-50 transition transform hover:scale-105 shadow-2xl"
          >
            Get Started for Free
          </Link>
          <p className="text-indigo-100 mt-6 text-sm">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center mb-4">
                <Globe className="h-8 w-8 text-indigo-500 mr-2" />
                <span className="text-2xl font-bold text-white">Tbodemy</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Making language learning accessible, effective, and enjoyable for everyone.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">Languages</Link></li>
                <li><Link href="/mobile" className="hover:text-white transition">Mobile App</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Tbodemy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}