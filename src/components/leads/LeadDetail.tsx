import React from 'react';
import { X, Mail, Building, Phone, User, Briefcase, Globe, Info } from 'lucide-react';

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

interface LeadDetailProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({ lead, isOpen, onClose }) => {
  if (!isOpen) return null;

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '(Kein Name)';
  
  // Extract standard fields from custom_fields object
  const url = lead.custom_fields?.url || null;
  const salutation = lead.custom_fields?.salutation || null;
  const emailSalutation = lead.custom_fields?.email_salutation || null;

  // Get remaining custom fields (excluding the standard ones)
  const standardKeys = ['url', 'salutation', 'email_salutation'];
  const customFields = lead.custom_fields 
    ? Object.entries(lead.custom_fields).filter(([key]) => !standardKeys.includes(key))
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">{fullName}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Info */}
            <div className="space-y-4 col-span-2">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">E-Mail-Adresse</div>
                  <div className="font-medium">{lead.email}</div>
                </div>
              </div>

              {lead.company && (
                <div className="flex items-start">
                  <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Firma</div>
                    <div className="font-medium">{lead.company}</div>
                  </div>
                </div>
              )}

              {lead.position && (
                <div className="flex items-start">
                  <Briefcase className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Position</div>
                    <div className="font-medium">{lead.position}</div>
                  </div>
                </div>
              )}

              {lead.phone && (
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Telefon</div>
                    <div className="font-medium">{lead.phone}</div>
                  </div>
                </div>
              )}

              {salutation && (
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Anrede</div>
                    <div className="font-medium">{salutation}</div>
                  </div>
                </div>
              )}

              {emailSalutation && (
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">E-Mail-Anrede</div>
                    <div className="font-medium">{emailSalutation}</div>
                  </div>
                </div>
              )}

              {url && (
                <div className="flex items-start">
                  <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Website</div>
                    <div className="font-medium">
                      <a 
                        href={url.startsWith('http') ? url : `https://${url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        {url}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <div className="col-span-2 mt-6">
                <h3 className="text-lg font-medium mb-4">Benutzerdefinierte Felder</h3>
                <div className="space-y-4">
                  {customFields.map(([key, value]) => (
                    <div key={key} className="flex items-start">
                      <Info className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">{key}</div>
                        <div className="font-medium">{value || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end bg-gray-50">
          <button 
            onClick={onClose}
            className="btn btn-secondary"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
