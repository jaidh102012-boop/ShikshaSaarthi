import React, { useState, useEffect, useRef } from "react";
import { Paperclip, Send, Loader, MessageCircle, History, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChatService, { Message as ChatMessage, ChatSession } from '../../services/chatService';

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
  file?: {
    name: string;
    type: string;
  };
}

interface UploadedFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

const SaarthiChat: React.FC = () => {
  const { user } = useAuth();
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatService = ChatService.getInstance();

  const timestamp = () => new Date().toLocaleTimeString();

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const loadSessions = async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const sessionList = await chatService.getSessions(user.id);
      setSessions(sessionList);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const createNewSession = async () => {
    if (!user) return;

    const session = await chatService.createSession(user.id);
    if (session) {
      setCurrentSessionId(session.id);
      setChat([]);
      await loadSessions();
    }
  };

  const loadSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const messages = await chatService.getSessionMessages(sessionId);
      setChat(messages);
      setCurrentSessionId(sessionId);
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat session?')) return;

    const success = await chatService.deleteSession(sessionId);
    if (success) {
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setChat([]);
      }
      await loadSessions();
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !uploadedFile) return;
    if (!user?.id) {
      alert('Please log in first');
      return;
    }

    let sessionId = currentSessionId;
    if (!sessionId) {
      const title = chatService.generateTitle(input.trim() || 'File upload');
      const session = await chatService.createSession(user.id, title);
      if (!session) return;
      sessionId = session.id;
      setCurrentSessionId(sessionId);
      await loadSessions();
    }

    const userContent = input.trim();
    let prompt = userContent;

    if (uploadedFile) {
      prompt = `File uploaded: ${uploadedFile.name}\n\nFile content:\n${uploadedFile.content}\n\n${userContent || "Please analyze this file and provide insights."}`;
    }

    const userMessage = await chatService.addMessage(
      sessionId,
      'user',
      userContent || '[File attached]'
    );

    if (userMessage) {
      setChat((prev) => [...prev, userMessage]);
    }

    const currentInput = input;
    const currentFile = uploadedFile;
    setInput("");
    setUploadedFile(null);
    setLoading(true);

    try {
      const reply = await chatService.sendMessage(prompt);
      const botMessage = await chatService.addMessage(sessionId, 'assistant', reply);

      if (botMessage) {
        setChat((prev) => [...prev, botMessage]);
      }

      if (chat.length === 0 && userContent) {
        const title = chatService.generateTitle(userContent);
        await chatService.updateSessionTitle(sessionId, title);
        await loadSessions();
      }
    } catch (err) {
      console.error('Send failed:', err);
      const errorMsg = await chatService.addMessage(
        sessionId,
        'assistant',
        "I'm currently offline. Please check your connection and try again."
      );
      if (errorMsg) {
        setChat((prev) => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        setUploadedFile({
          name: file.name,
          content: content,
          type: file.type,
          size: file.size
        });
      };

      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert("Failed to read file. Please try again.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  return (
    <div className="flex h-full bg-white">
      {showHistory && (
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Chat History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No chat history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => loadSession(session.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      currentSessionId === session.id
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.length === 0 && !showHistory && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Hi {user?.name || 'there'}!
                </h3>
                <p className="text-gray-500">I am SAARTHI, your study buddy.</p>
                <p className="text-gray-500">How can I help you today?</p>
              </div>
            </div>
          )}

          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString() : timestamp()}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">SAARTHI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {uploadedFile && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <Paperclip className="h-4 w-4" />
                <span className="font-medium">{uploadedFile.name}</span>
                <span className="text-xs text-blue-600">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <div className="p-4 border-t bg-white">
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Chat history"
            >
              <History className="h-5 w-5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.md,.pdf,text/*,application/pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Upload file"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !uploadedFile)}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Upload files to get instant answers and explanations
          </p>
        </div>
      </div>
    </div>
  );
};

export default SaarthiChat;
