import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

class ChatService {
  private static instance: ChatService;

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async createSession(userId: string, title: string = 'New Chat'): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{ user_id: userId, title }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      return null;
    }
  }

  async getSessions(userId: string): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
      return [];
    }
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  async addMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{ session_id: sessionId, role, content }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return data;
    } catch (error) {
      console.error('Failed to add message:', error);
      return null;
    }
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return !error;
    } catch (error) {
      console.error('Failed to update session title:', error);
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      return !error;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  generateTitle(firstMessage: string): string {
    const maxLength = 50;
    const cleaned = firstMessage.trim();
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    return cleaned.substring(0, maxLength) + '...';
  }

  async sendMessage(prompt: string): Promise<string> {
    try {
      const res = await fetch('http://localhost:5000/api/saarthi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      return data.reply || 'No reply received.';
    } catch (err) {
      console.error('Failed to send message:', err);
      return 'Server is currently unavailable. Please try again later.';
    }
  }
}

export default ChatService;
