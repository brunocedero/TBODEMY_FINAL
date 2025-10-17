import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Agregar token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== TIPOS ====================
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'teacher';
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  teacher_id: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: number;
  course_id: number;
  title: string;
  content: string | null;
  order: number;
  created_at: string;
}

export interface Quiz {
  id: number;
  unit_id: number;
  quiz_type: 'fill_blank' | 'multiple_choice';
  question: string;
  correct_answer: string;
  options: string[] | null;
  order: number;
}

export interface AudioSentence {
  id: number;
  unit_id: number;
  sentence: string;
  audio_path: string;
  order: number;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  corrected_content: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Friendship {
  id: number;
  requester_id: number;
  receiver_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

// ==================== AUTH ====================
export const auth = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const { data } = await api.post('/token', formData);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  register: async (email: string, password: string, name: string, role: 'student' | 'teacher') => {
    const { data } = await api.post('/register', { email, password, name, role });
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

// ==================== COURSES ====================
export const courses = {
  getAll: async () => {
    const { data } = await api.get<Course[]>('/courses');
    return data;
  },

  getMyCourses: async () => {
    const { data } = await api.get<Course[]>('/my-courses');
    return data;
  },

  getById: async (id: number) => {
    const { data } = await api.get(`/courses/${id}`);
    return data;
  },

  create: async (courseData: { title: string; description?: string }) => {
    const { data } = await api.post('/courses', courseData);
    return data;
  },

  update: async (id: number, courseData: Partial<Course>) => {
    const { data } = await api.put(`/courses/${id}`, courseData);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/courses/${id}`);
  },
};

// ==================== UNITS ====================
export const units = {
  getByCourse: async (courseId: number) => {
    const { data } = await api.get<Unit[]>(`/courses/${courseId}/units`);
    return data;
  },

  getById: async (unitId: number) => {
    const { data } = await api.get<Unit>(`/units/${unitId}`);
    return data;
  },

  create: async (unitData: { course_id: number; title: string; content?: string; order: number }) => {
    const { data } = await api.post('/units', unitData);
    return data;
  },

  update: async (id: number, unitData: Partial<Unit>) => {
    const { data } = await api.put(`/units/${id}`, unitData);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/units/${id}`);
  },
};

// ==================== AUDIO SENTENCES ====================
export const audioSentences = {
  getByUnit: async (unitId: number) => {
    const { data } = await api.get<AudioSentence[]>(`/units/${unitId}/audio-sentences`);
    return data;
  },

  create: async (audioData: { unit_id: number; sentence: string; order: number }) => {
    const { data } = await api.post('/audio-sentences', {
      unit_id: audioData.unit_id,
      sentence: audioData.sentence,
      audio_path: '',
      order: audioData.order,
    });
    return data;
  },

  update: async (id: number, audioData: Partial<AudioSentence>) => {
    const { data } = await api.put(`/audio-sentences/${id}`, audioData);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/audio-sentences/${id}`);
  },
};

// ==================== QUIZZES ====================
export const quizzes = {
  getByUnit: async (unitId: number) => {
    const { data } = await api.get<Quiz[]>(`/units/${unitId}/quizzes`);
    return data;
  },

  create: async (quizData: {
    unit_id: number;
    quiz_type: 'fill_blank' | 'multiple_choice';
    question: string;
    correct_answer: string;
    options?: string[];
    order: number;
  }) => {
    const { data } = await api.post('/quizzes', quizData);
    return data;
  },

  update: async (id: number, quizData: Partial<Quiz>) => {
    const { data } = await api.put(`/quizzes/${id}`, quizData);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/quizzes/${id}`);
  },
};

// ==================== SOCIAL FEATURES ====================
export const social = {
  getAllStudents: async () => {
    const { data } = await api.get<User[]>('/students');
    return data;
  },

  sendFriendRequest: async (receiverId: number) => {
    const { data } = await api.post('/friend-requests', null, {
      params: { receiver_id: receiverId }
    });
    return data;
  },

  getFriendRequests: async () => {
    const { data } = await api.get<Friendship[]>('/friend-requests');
    return data;
  },

  acceptRequest: async (friendshipId: number) => {
    const { data } = await api.post(`/friend-requests/${friendshipId}/accept`);
    return data;
  },

  rejectRequest: async (friendshipId: number) => {
    const { data } = await api.post(`/friend-requests/${friendshipId}/reject`);
    return data;
  },

  getFriends: async () => {
    const { data } = await api.get<User[]>('/friends');
    return data;
  },

  sendMessage: async (receiverId: number, content: string) => {
    const { data } = await api.post<Message>('/messages', {
      receiver_id: receiverId,
      content
    });
    return data;
  },

  getConversations: async () => {
    const { data } = await api.get('/conversations');
    return data;
  },

  getConversation: async (otherUserId: number) => {
    const { data } = await api.get<Message[]>(`/conversations/${otherUserId}`);
    return data;
  },

  checkGrammar: async (text: string) => {
    const { data } = await api.post('/grammar-check', null, {
      params: { text }
    });
    return data;
  }
};