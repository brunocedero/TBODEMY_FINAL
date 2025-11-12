'use client';

import { useState, useEffect, useRef } from 'react';
import { speaking } from '@/lib/api';

interface SpeakingMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  corrected_content?: string | null;
  audio_path?: string | null;
  created_at: string;
}

interface SpeakingSessionData {
  id: number;
  topic: string;
  conversation_type: string;
  difficulty_level: string;
  messages: SpeakingMessage[];
}

interface Props {
  sessionId: number;
  onEnd: () => void;
}

export default function SpeakingSession({ sessionId, onEnd }: Props) {
  const [session, setSession] = useState<SpeakingSessionData | null>(null);
  const [messages, setMessages] = useState<SpeakingMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar sesión inicial
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSession = async () => {
    try {
      const data = await speaking.getSessionById(sessionId);
      setSession(data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading session:', error);
      setError('Error al cargar la sesión');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudio(audioBlob);
        
        // Detener el stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Error al acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Enviar audio y recibir AMBOS mensajes
      const response = await speaking.sendAudioMessage(sessionId, audioBlob);
      
      // ✅ CORRECCIÓN: Agregar AMBOS mensajes correctamente
      setMessages(prev => [
        ...prev,
        response.user_message,      // Mensaje del estudiante
        response.assistant_message  // Mensaje de la IA
      ]);

      // Reproducir audio de respuesta automáticamente
      if (response.assistant_message.audio_path) {
        playAudio(response.assistant_message.audio_path);
      }
      
    } catch (error: any) {
      console.error('Error sending audio:', error);
      
      if (error.message?.includes('cuota') || error.message?.includes('quota')) {
        setError(
          '⚠️ Has excedido tu cuota de OpenAI. ' +
          'Por favor, verifica tu cuenta en platform.openai.com'
        );
      } else {
        setError(error.message || 'Error al procesar el audio. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (audioPath: string) => {
    try {
      // Asegurarse de que la ruta sea correcta
      const fullPath = audioPath.startsWith('http') 
        ? audioPath 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${audioPath}`;
      
      const audio = new Audio(fullPath);
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Error al reproducir el audio');
      });
    } catch (error) {
      console.error('Error creating audio:', error);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Speaking Practice: {session.topic}
        </h1>
        <div className="flex gap-4 text-sm text-gray-600">
          <span className="px-3 py-1 bg-blue-100 rounded-full">
            {session.conversation_type}
          </span>
          <span className="px-3 py-1 bg-green-100 rounded-full">
            {session.difficulty_level}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 bg-white rounded-lg shadow-sm p-4 overflow-y-auto mb-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {/* Icono y rol */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <span className="text-sm font-semibold">
                    {message.role === 'user' ? 'Tú' : 'AI Teacher'}
                  </span>
                </div>

                {/* Contenido del mensaje */}
                <p className="text-base mb-2">{message.content}</p>

                {/* Corrección gramatical (solo para mensajes del usuario) */}
                {message.role === 'user' && message.corrected_content && (
                  <div className="mt-3 pt-3 border-t border-blue-400">
                    <p className="text-xs font-semibold mb-1">✨ Corrección sugerida:</p>
                    <p className="text-sm italic">{message.corrected_content}</p>
                  </div>
                )}

                {/* Botón de reproducir audio (solo para mensajes del asistente) */}
                {message.role === 'assistant' && message.audio_path && (
                  <button
                    onClick={() => playAudio(message.audio_path!)}
                    className="mt-2 flex items-center gap-2 text-sm px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                    </svg>
                    Reproducir audio
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Indicador de procesamiento */}
          {isProcessing && (
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className="text-gray-600">Procesando tu mensaje...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isRecording ? (
              <>
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                Detener grabación
              </>
            ) : (
              <>
                🎤 Grabar mensaje
              </>
            )}
          </button>

          <button
            onClick={onEnd}
            disabled={isRecording || isProcessing}
            className="px-6 py-3 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Finalizar sesión
          </button>
        </div>

        {isRecording && (
          <p className="text-center text-sm text-gray-600 mt-2">
            🔴 Grabando... Habla claramente y presiona "Detener grabación" cuando termines
          </p>
        )}
      </div>
    </div>
  );
}