import React, { useEffect, useState } from 'react';
import { useSupabaseSync } from '../../hooks/useSupabaseSync';
import { supabaseSync } from '../../lib/supabaseSync';
import { Tables, supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type LeadGroup = Tables<'lead_groups'>;

const SyncExample: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Use our sync hook to get realtime updates
  const { 
    data: groups, 
    status, 
    isLoading,
    updateLocalData 
  } = useSupabaseSync<LeadGroup>({
    table: 'lead_groups',
    filter: user ? supabaseSync.filterByUserId(user.id) : undefined,
    enabled: !!user,
    onDataChange: (newData) => {
      console.log('Lead groups updated:', newData);
    }
  });
  
  // Initial data loading (this is now handled by the hook)
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Synchronisierte Gruppen</h2>
      
      <div className="mb-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Status: {status}
        </span>
      </div>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Daten werden geladen...</p>
        </div>
      ) : groups.length === 0 ? (
        <p className="text-gray-500 py-4 text-center">Keine Gruppen gefunden.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {groups.map((group) => (
            <li key={group.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">{group.name}</h3>
                  <p className="text-xs text-gray-500">
                    Erstellt: {new Date(group.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SyncExample;
