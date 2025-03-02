import { RealtimeChannel } from '@supabase/realtime-js';
import { supabase } from './supabase';

/**
 * Utility functions for Supabase real-time sync
 */
export const supabaseSync = {
  /**
   * Subscribe to changes on a specific table
   * @param table Table name
   * @param callback Callback function to handle changes
   * @param filter Filter condition (e.g., eq('column', value))
   * @returns Channel subscription that can be unsubscribed
   */
  subscribeToChanges<T>(
    table: string,
    callback: (data: T, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
    filter?: { column: string; value: any }
  ): RealtimeChannel {
    const channel = supabase
      .channel(`${table}-changes-${Math.random().toString(36).substring(2, 10)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
        },
        (payload) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const data = (eventType === 'DELETE' ? payload.old : payload.new) as T;
          callback(data, eventType);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Commonly used filters
   */
  // Filter by user ID
  filterByUserId: (userId: string) => (query: any) => query.eq('user_id', userId),
  
  // Filter by status
  filterByStatus: (status: string) => (query: any) => query.eq('status', status),
  
  // Filter by ID
  filterById: (id: string) => (query: any) => query.eq('id', id),
  
  // Order by created_at (newest first)
  orderByCreatedAtDesc: (query: any) => query.order('created_at', { ascending: false }),
  
  // Order by updated_at (newest first)
  orderByUpdatedAtDesc: (query: any) => query.order('updated_at', { ascending: false }),
  
  // Combine multiple filters
  combineFilters: (...filters: ((query: any) => any)[]) => {
    return (query: any) => {
      let result = query;
      for (const filter of filters) {
        result = filter(result);
      }
      return result;
    };
  }
};
