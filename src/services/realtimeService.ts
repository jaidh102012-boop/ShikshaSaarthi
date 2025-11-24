type RealtimeCallback = (data: any) => void;

class RealtimeService {
  private static instance: RealtimeService;
  private subscriptions: Map<string, any> = new Map();
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();
  private localListeners: Map<string, Set<RealtimeCallback>> = new Map();

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Subscribe to real-time changes
   */
  subscribe(channel: string, callback: RealtimeCallback): () => void {
    // For local data, use localStorage listeners
    if (!this.localListeners.has(channel)) {
      this.localListeners.set(channel, new Set());
    }
    this.localListeners.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.localListeners.get(channel);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Emit local data change
   */
  emit(channel: string, data: any): void {
    if (this.localListeners.has(channel)) {
      this.localListeners.get(channel)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in realtime callback for ${channel}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to attendance changes
   */
  onAttendanceUpdate(callback: RealtimeCallback): () => void {
    return this.subscribe('attendance_updates', callback);
  }

  /**
   * Subscribe to assignment changes
   */
  onAssignmentUpdate(callback: RealtimeCallback): () => void {
    return this.subscribe('assignment_updates', callback);
  }

  /**
   * Subscribe to timetable changes
   */
  onTimetableUpdate(callback: RealtimeCallback): () => void {
    return this.subscribe('timetable_updates', callback);
  }

  /**
   * Subscribe to exam timetable changes
   */
  onExamTimetableUpdate(callback: RealtimeCallback): () => void {
    return this.subscribe('exam_timetable_updates', callback);
  }

  /**
   * Subscribe to profile updates
   */
  onProfileUpdate(callback: RealtimeCallback): () => void {
    return this.subscribe('profile_updates', callback);
  }

  /**
   * Subscribe to class announcements
   */
  onAnnouncementUpdate(callback: RealtimeCallback): () => void {
    return this.subscribe('announcement_updates', callback);
  }

  /**
   * Subscribe to submission grade updates
   */
  onGradeUpdate(callback: RealtimeCallback): () => void {
    return this.subscribe('grade_updates', callback);
  }

  /**
   * Trigger attendance update
   */
  broadcastAttendanceUpdate(data: any): void {
    this.emit('attendance_updates', data);
  }

  /**
   * Trigger assignment update
   */
  broadcastAssignmentUpdate(data: any): void {
    this.emit('assignment_updates', data);
  }

  /**
   * Trigger timetable update
   */
  broadcastTimetableUpdate(data: any): void {
    this.emit('timetable_updates', data);
  }

  /**
   * Trigger exam timetable update
   */
  broadcastExamTimetableUpdate(data: any): void {
    this.emit('exam_timetable_updates', data);
  }

  /**
   * Trigger profile update
   */
  broadcastProfileUpdate(data: any): void {
    this.emit('profile_updates', data);
  }

  /**
   * Trigger announcement
   */
  broadcastAnnouncement(data: any): void {
    this.emit('announcement_updates', data);
  }

  /**
   * Trigger grade update
   */
  broadcastGradeUpdate(data: any): void {
    this.emit('grade_updates', data);
  }

  /**
   * Unsubscribe all listeners
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    this.subscriptions.clear();
    this.listeners.clear();
    this.localListeners.clear();
  }

  /**
   * Get active subscriber count
   */
  getSubscriberCount(channel: string): number {
    return this.localListeners.get(channel)?.size || 0;
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.localListeners.keys());
  }
}

export default RealtimeService;
