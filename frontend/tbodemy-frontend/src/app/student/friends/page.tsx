'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, social, type User, type Friendship } from '@/lib/api';

export default function FriendsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = auth.getUser();
    setUser(currentUser);
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [friendsData, requestsData, studentsData] = await Promise.all([
        social.getFriends(),
        social.getFriendRequests(),
        social.getAllStudents()
      ]);
      
      setFriends(friendsData);
      setRequests(requestsData);
      setAllStudents(studentsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (receiverId: number) => {
    try {
      await social.sendFriendRequest(receiverId);
      alert('✓ Request sent');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error sending request');
    }
  };

  const handleAccept = async (friendshipId: number) => {
    try {
      await social.acceptRequest(friendshipId);
      loadData();
    } catch (err) {
      alert('Error accepting request');
    }
  };

  const handleReject = async (friendshipId: number) => {
    try {
      await social.rejectRequest(friendshipId);
      loadData();
    } catch (err) {
      alert('Error rejecting request');
    }
  };

  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const friendIds = friends.map(f => f.id);

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
              <h1 className="text-2xl font-bold text-indigo-600">👥 Friends</h1>
            </div>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'friends'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 px-6 py-4 font-medium transition relative ${
                activeTab === 'requests'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Requests ({requests.length})
              {requests.length > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {requests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'search'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Search students
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'friends' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your friends</h2>
            {friends.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-600">
                  You don&apos;t have any friends yet. Search for students and send requests!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                        <p className="text-sm text-gray-600">{friend.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/student/chat/${friend.id}`)}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      💬 Send message
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending requests</h2>
            {requests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600">You don&apos;t have any pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const requester = allStudents.find(s => s.id === request.requester_id);
                  if (!requester) return null;
                  
                  return (
                    <div
                      key={request.id}
                      className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{requester.name}</h3>
                          <p className="text-sm text-gray-600">{requester.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                          ✗ Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Search students</h2>
            
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Results */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>
                  
                  {friendIds.includes(student.id) ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed"
                    >
                      ✓ Already friends
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(student.id)}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      + Send request
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
