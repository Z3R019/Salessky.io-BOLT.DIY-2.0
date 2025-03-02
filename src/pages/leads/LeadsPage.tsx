import React, { useState, useEffect } from 'react';
import { Upload, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ImportGroupList from '../../components/leads/ImportGroupList';
import CSVUploader from '../../components/leads/CSVUploader';
import CSVMappingModal, { ColumnMapping } from '../../components/leads/CSVMappingModal';
import LeadList from '../../components/leads/LeadList';
import LeadDetail from '../../components/leads/LeadDetail';

interface ImportGroup {
  id: string;
  name: string;
  contactCount: number;
  createdAt: string;
}

interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  company: string | null;
  position: string | null;
  phone: string | null;
  custom_fields: Record<string, any> | null;
}

const LeadsPage: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [importGroups, setImportGroups] = useState<ImportGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);

  useEffect(() => {
    // Fetch import groups from API
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('lead_groups')
          .select('id, name, created_at')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          const formattedGroups = data.map(group => ({
            id: group.id,
            name: group.name,
            contactCount: Math.floor(Math.random() * 100) + 5, // Mock data - replace with actual count
            createdAt: new Date(group.created_at).toLocaleDateString('de-DE')
          }));
          
          setImportGroups(formattedGroups);
        }
      } catch (error) {
        console.error('Error fetching import groups:', error);
      }
    };
    
    fetchGroups();
  }, []);

  useEffect(() => {
    // When a group is selected, fetch its leads
    if (selectedGroupId) {
      fetchLeads(selectedGroupId);
    } else {
      setLeads([]);
    }
  }, [selectedGroupId]);

  const fetchLeads = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('group_id', groupId);
        
      if (error) throw error;
      
      if (data) {
        setLeads(data as Lead[]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setShowMappingModal(true); // Automatically open mapping modal
  };

  const handleMappingSave = async (mappings: ColumnMapping, file: File) => {
    setShowMappingModal(false);
    setIsUploading(true);
    
    // Mock implementation - In a real app, you would process the CSV with the mappings
    // and upload the data to your backend
    try {
      // Create a new import group
      const groupName = file.name.replace('.csv', '');
      const { data: groupData, error: groupError } = await supabase
        .from('lead_groups')
        .insert([{ name: groupName }])
        .select();
        
      if (groupError) throw groupError;
      
      if (groupData && groupData.length > 0) {
        const newGroup = {
          id: groupData[0].id,
          name: groupData[0].name,
          contactCount: 0, // Will be updated when leads are added
          createdAt: new Date(groupData[0].created_at).toLocaleDateString('de-DE')
        };
        
        // Add the new group to the list and select it
        setImportGroups(prev => [newGroup, ...prev]);
        setSelectedGroupId(newGroup.id);
        
        // In a real implementation, you would process the CSV file here and add leads to the database
        // This is just a mock to show the workflow
        setTimeout(() => {
          setIsUploading(false);
          // Mock notification
          alert('CSV erfolgreich importiert und Leads hinzugefügt!');
          // Refresh leads for the selected group
          fetchLeads(newGroup.id);
        }, 1500);
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setIsUploading(false);
    }
  };

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetail(true);
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  const handleEditGroup = (id: string) => {
    // Implementation for editing a group
    console.log('Edit group', id);
  };

  const handleArchiveGroup = (id: string) => {
    // Implementation for archiving a group
    console.log('Archive group', id);
  };

  const handleDeleteGroup = (id: string) => {
    // Implementation for deleting a group
    console.log('Delete group', id);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Leads</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column - Groups and Upload */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Import-Gruppen</h2>
              <button 
                className="btn btn-primary btn-sm flex items-center"
                onClick={() => setIsUploading(true)}
              >
                <PlusCircle size={16} className="mr-2" />
                Neu
              </button>
            </div>
            
            <ImportGroupList 
              groups={importGroups}
              onGroupSelect={handleGroupSelect}
              onEdit={handleEditGroup}
              onArchive={handleArchiveGroup}
              onDelete={handleDeleteGroup}
              selectedGroupId={selectedGroupId}
            />
          </div>
          
          {isUploading && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">CSV hochladen</h2>
              <CSVUploader onFileSelect={handleFileSelect} />
              <button
                onClick={() => setIsUploading(false)}
                className="mt-4 btn btn-secondary w-full"
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>
        
        {/* Right column - Leads list */}
        <div className="w-full md:w-2/3">
          {selectedGroupId ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">
                {importGroups.find(g => g.id === selectedGroupId)?.name || 'Leads'}
              </h2>
              <LeadList 
                leads={leads} 
                onLeadSelect={handleLeadSelect}
                selectedLead={selectedLead}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center text-center h-64">
              <Upload size={48} className="text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-500 mb-2">Keine Gruppe ausgewählt</h2>
              <p className="text-gray-400">
                Wählen Sie eine Import-Gruppe aus der linken Spalte oder erstellen Sie eine neue Gruppe.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {selectedFile && (
        <CSVMappingModal
          isOpen={showMappingModal}
          file={selectedFile}
          onClose={() => setShowMappingModal(false)}
          onSave={handleMappingSave}
        />
      )}
      
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          isOpen={showLeadDetail}
          onClose={() => setShowLeadDetail(false)}
        />
      )}
    </div>
  );
};

export default LeadsPage;
