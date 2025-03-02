import { useState, useEffect, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UseSupabaseSyncOptions {
  table: string;
  filter?: (query: any) => any;
  enabled?: boolean;
  orderBy?: { column: string; ascending?: boolean };
}

export function useSupabaseSync<T>({
  table,
  filter,
  enabled = true,
  orderBy
}: UseSupabaseSyncOptions) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch data
  const fetchData = useCallback(async () => {
    try {
      if (!enabled) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      let query = supabase.from(table).select('*');
      
      // Apply filter if provided
      if (filter) {
        query = filter(query);
      }
      
      // Apply ordering if provided
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }
      
      const { data: fetchedData, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      setData(fetchedData as T[]);
    } catch (err) {
      console.error(`Error fetching data from ${table}:`, err);
      setError(err instanceof Error ? err : new Error('Ein unbekannter Fehler ist aufgetreten'));
    } finally {
      setIsLoading(false);
    }
  }, [table, filter, enabled, orderBy]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled) return;
    
    const subscription = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          // Handle the real-time update based on the type of change
          if (payload.eventType === 'INSERT') {
            setData(prevData => [...prevData, payload.new as T]);
          } else if (payload.eventType === 'UPDATE') {
            setData(prevData => 
              prevData.map(item => 
                (item as any).id === (payload.new as any).id ? payload.new : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData(prevData => 
              prevData.filter(item => (item as any).id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [table, enabled]);

  // Function to manually update the local data
  const updateLocalData = useCallback((updater: (prevData: T[]) => T[]) => {
    setData(updater);
  }, []);

  // Function to manually reload data from the server
  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, isLoading, error, updateLocalData, refetch };
}
