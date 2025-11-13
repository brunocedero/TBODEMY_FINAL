import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('🔥 API.TS LOADED - API_URL:', API_URL);

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

  getStudents: async (courseId: number) => {
    const { data } = await api.get<User[]>(`/courses/${courseId}/students`);
    return data;
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


// ==================== TIPOS DE SPEAKING ====================
export interface SpeakingSession {
  id: number;
  student_id: number;
  topic: string;
  conversation_type: 'formal' | 'informal' | 'business' | 'casual';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  created_at: string;
}

export interface SpeakingMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  corrected_content?: string | null;  // ⬅️ YA ESTÁ CORRECTO
  audio_path?: string | null;
  created_at: string;
}

export interface SpeakingMessageResponse {
  user_message: SpeakingMessage;      // ⬅️ YA ESTÁ CORRECTO
  assistant_message: SpeakingMessage; // ⬅️ YA ESTÁ CORRECTO
}

export interface SpeakingSessionWithMessages extends SpeakingSession {
  messages: SpeakingMessage[];
}

// ==================== SPEAKING PRACTICE ====================
export const speaking = {
  // Crear nueva sesión de speaking
  createSession: async (sessionData: {
    topic: string;
    conversation_type: 'formal' | 'informal' | 'business' | 'casual';
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  }) => {
    const { data } = await api.post<SpeakingSession>('/speaking/sessions', sessionData);
    return data;
  },

  // Obtener todas las sesiones del estudiante
  getMySessions: async () => {
    const { data } = await api.get<SpeakingSession[]>('/speaking/sessions');
    return data;
  },

  // Obtener detalles de una sesión con mensajes
  getSessionById: async (sessionId: number) => {
    const { data } = await api.get<SpeakingSessionWithMessages>(`/speaking/sessions/${sessionId}`);
    return data;
  },

  // Enviar mensaje de audio - ✅ ACTUALIZADO
  sendAudioMessage: async (sessionId: number, audioBlob: Blob): Promise<SpeakingMessageResponse> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    
    try {
      const { data } = await api.post<SpeakingMessageResponse>(
        `/speaking/sessions/${sessionId}/message`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      // ✅ Ahora devuelve un objeto con user_message y assistant_message
      return data;
      
    } catch (error: any) {
      // Manejo específico para error 429 (cuota excedida)
      if (error.response?.status === 429) {
        throw new Error(
          'Has excedido tu cuota de transcripción de OpenAI. Por favor, verifica tu cuenta en platform.openai.com o intenta más tarde.'
        );
      }
      
      // Manejo de otros errores
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      
      throw new Error('Error al enviar el mensaje de audio. Por favor, intenta nuevamente.');
    }
  },

  // Finalizar sesión
  endSession: async (sessionId: number) => {
    const { data } = await api.post(`/speaking/sessions/${sessionId}/end`);
    return data;
  },
};


// ==================== ENROLLMENTS ====================
export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  enrolled_at: string;
  progress: any;
}

export const enrollments = {
  // Inscribirse en un curso
  enroll: async (courseId: number) => {
    const { data } = await api.post<Enrollment>('/enrollments', {
      course_id: courseId
    });
    return data;
  },

  // Obtener mis inscripciones
  getMyEnrollments: async () => {
    const { data } = await api.get<Enrollment[]>('/my-enrollments');
    return data;
  },

  // Verificar si estoy inscrito en un curso
  isEnrolled: async (courseId: number) => {
    const enrollments = await api.get<Enrollment[]>('/my-enrollments');
    return enrollments.data.some(e => e.course_id === courseId);
  },
};
