import React, { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';

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

interface LeadListProps {
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
  selectedLead: Lead | null;
}

const LeadList: React.FC<LeadListProps> = ({ leads, onLeadSelect, selectedLead }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = leads.filter(lead => {
    const searchString = searchTerm.toLowerCase();
    const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim().toLowerCase();
    
    return fullName.includes(searchString) 
      || (lead.company || '').toLowerCase().includes(searchString)
      || lead.email.toLowerCase().includes(searchString);
  });

  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Kontakte durchsuchen..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Keine Kontakte gefunden.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firma
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => {
                const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '(Kein Name)';
                
                return (
                  <tr 
                    key={lead.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedLead?.id === lead.id ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => onLeadSelect(lead)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{fullName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{lead.company || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-primary-600 hover:text-primary-800">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeadList;
