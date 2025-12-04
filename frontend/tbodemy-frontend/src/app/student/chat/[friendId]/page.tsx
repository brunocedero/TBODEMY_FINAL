'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, social, type Message, type User } from '@/lib/api';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const friendId = Number(params.friendId);

  const [user, setUser] = useState<any>(null);
  const [friend, setFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [grammarCheck, setGrammarCheck] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = auth.getUser();
    setUser(currentUser);
    loadData();

    // Polling for new messages
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [friendId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check grammar while typing
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (newMessage.trim().length > 3) {
      setIsChecking(true);
      checkTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await social.checkGrammar(newMessage);
          setGrammarCheck(result);
        } catch (err) {
          console.error('Error checking grammar:', err);
        } finally {
          setIsChecking(false);
        }
      }, 500);
    } else {
      setGrammarCheck(null);
    }
  }, [newMessage]);

  const loadData = async () => {
    try {
      const [friendsData, messagesData] = await Promise.all([
        social.getFriends(),
        social.getConversation(friendId)
      ]);
      
      const friendData = friendsData.find((f: User) => f.id === friendId);
      setFriend(friendData || null);
      setMessages(messagesData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await social.getConversation(friendId);
      setMessages(messagesData);
    } catch (err) {
      // Silent
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await social.sendMessage(friendId, newMessage);
      setNewMessage('');
      setGrammarCheck(null);
      await loadMessages();
    } catch (err) {
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const useCorrectedText = () => {
    if (grammarCheck?.corrected) {
      setNewMessage(grammarCheck.corrected);
      setGrammarCheck(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/student/friends')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{friend?.name}</h1>
                <p className="text-sm text-gray-600">{friend?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          isOwn
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        
                        {/* Show corrections if available */}
                        {message.corrected_content && message.corrected_content !== message.content && (
                          <div className={`mt-2 pt-2 border-t ${isOwn ? 'border-indigo-500' : 'border-gray-300'}`}>
                            <p className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-600'} mb-1`}>
                              ✏️ Suggested correction:
                            </p>
                            <p className={`text-sm ${isOwn ? 'text-indigo-100' : 'text-gray-700'}`}>
                              {message.corrected_content}
                            </p>
                          </div>
                        )}
                        
                        <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {new Date(message.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Grammar Check Panel */}
      {grammarCheck && grammarCheck.has_errors && (
        <div className="bg-yellow-50 border-t border-yellow-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 mb-2">
                  Correction suggestions:
                </p>
                {grammarCheck.corrections.map((correction: any, index: number) => (
                  <div key={index} className="text-sm text-yellow-800 mb-1">
                    <span className="font-medium">"{correction.error}"</span> → {correction.suggestion}
                    <span className="text-xs text-yellow-600 ml-2">({correction.message})</span>
                  </div>
                ))}
                <button
                  onClick={useCorrectedText}
                  className="mt-2 text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                >
                  Use corrected text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write your message in English..."
              rows={2}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {sending ? '...' : '📤'}
            </button>
          </div>
          {isChecking && (
            <p className="text-xs text-gray-500 mt-2">
              ⏳ Checking grammar...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
