import { createClient } from '@supabase/supabase-js';
import { MedicalLeave } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class MedicalLeaveService {
  private static instance: MedicalLeaveService;

  static getInstance(): MedicalLeaveService {
    if (!MedicalLeaveService.instance) {
      MedicalLeaveService.instance = new MedicalLeaveService();
    }
    return MedicalLeaveService.instance;
  }

  async submitMedicalLeave(leave: Omit<MedicalLeave, 'id' | 'created_at' | 'updated_at' | 'submitted_at'>): Promise<MedicalLeave | null> {
    try {
      const { data, error } = await supabase
        .from('medical_leaves')
        .insert([leave])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to submit medical leave:', error);
      return null;
    }
  }

  async getStudentMedicalLeaves(studentId: string): Promise<MedicalLeave[]> {
    try {
      const { data, error } = await supabase
        .from('medical_leaves')
        .select('*')
        .eq('student_id', studentId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch medical leaves:', error);
      return [];
    }
  }

  async getClassMedicalLeaves(classValue: string, section: string): Promise<MedicalLeave[]> {
    try {
      const { data, error } = await supabase
        .from('medical_leaves')
        .select('*')
        .eq('class', classValue)
        .eq('section', section)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch class medical leaves:', error);
      return [];
    }
  }

  async getPendingMedicalLeaves(): Promise<MedicalLeave[]> {
    try {
      const { data, error } = await supabase
        .from('medical_leaves')
        .select('*')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch pending medical leaves:', error);
      return [];
    }
  }

  async approveMedicalLeave(id: string, reviewedBy: string, remarks?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('medical_leaves')
        .update({
          status: 'approved',
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          remarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Failed to approve medical leave:', error);
      return false;
    }
  }

  async rejectMedicalLeave(id: string, reviewedBy: string, remarks: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('medical_leaves')
        .update({
          status: 'rejected',
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          remarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Failed to reject medical leave:', error);
      return false;
    }
  }

  async updateMedicalLeave(id: string, updates: Partial<MedicalLeave>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('medical_leaves')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Failed to update medical leave:', error);
      return false;
    }
  }

  calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return '✓';
      case 'rejected':
        return '✕';
      case 'pending':
        return '⏳';
      default:
        return '○';
    }
  }
}

export default MedicalLeaveService;
