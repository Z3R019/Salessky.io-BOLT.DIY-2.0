import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface CSVMappingModalProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
  onSave: (mappings: ColumnMapping, file: File) => void;
}

export interface ColumnMapping {
  url?: string;
  company_name?: string;
  salutation?: string;
  email_salutation?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  customFields: Record<string, string>;
}

const CSVMappingModal: React.FC<CSVMappingModalProps> = ({ file, isOpen, onClose, onSave }) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<ColumnMapping>({
    email: '',
    customFields: {},
  });
  const [customFields, setCustomFields] = useState<Array<{ id: string; name: string; column: string }>>([]);
  const [newCustomFieldName, setNewCustomFieldName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (file && isOpen) {
      setProcessing(true);
      parseCSVFile(file);
    }
  }, [file, isOpen]);

  const parseCSVFile = (file: File) => {
    Papa.parse(file, {
      preview: 5, // Preview only first 5 rows for mapping
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headerRow = results.data[0] as string[];
          const dataRows = results.data.slice(1) as string[][];
          
          setHeaders(headerRow);
          setRows(dataRows);
          
          // Try to automatically map common column names
          const initialMappings: ColumnMapping = {
            email: '',
            customFields: {},
          };
          
          headerRow.forEach((header, index) => {
            const lowerHeader = header.toLowerCase();
            
            if (lowerHeader.includes('email') || lowerHeader === 'e-mail' || lowerHeader === 'e_mail') {
              initialMappings.email = header;
            } else if (lowerHeader.includes('url') || lowerHeader.includes('website') || lowerHeader.includes('webseite')) {
              initialMappings.url = header;
            } else if (lowerHeader.includes('firma') || lowerHeader.includes('company') || lowerHeader.includes('unternehmen')) {
              initialMappings.company_name = header;
            } else if (lowerHeader.includes('anrede') || lowerHeader.includes('salutation')) {
              initialMappings.salutation = header;
            } else if (lowerHeader.includes('email_anrede') || lowerHeader.includes('email_salutation')) {
              initialMappings.email_salutation = header;
            } else if (
              lowerHeader.includes('vorname') || 
              lowerHeader.includes('first') || 
              lowerHeader === 'name' && (!lowerHeader.includes('last') && !lowerHeader.includes('nach'))
            ) {
              initialMappings.first_name = header;
            } else if (lowerHeader.includes('nachname') || lowerHeader.includes('last')) {
              initialMappings.last_name = header;
            }
          });
          
          setMappings(initialMappings);
        } else {
          setError('Die CSV-Datei enthält keine Daten oder hat ein ungültiges Format.');
        }
        setProcessing(false);
      },
      error: (error) => {
        setError(`Fehler beim Parsen der CSV-Datei: ${error.message}`);
        setProcessing(false);
      }
    });
  };

  const handleMappingChange = (field: keyof Omit<ColumnMapping, 'customFields'>, value: string) => {
    setMappings(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldChange = (id: string, column: string) => {
    setCustomFields(prev => 
      prev.map(field => field.id === id ? { ...field, column } : field)
    );
    
    // Update the mappings
    const updatedCustomFields = { ...mappings.customFields };
    const field = customFields.find(f => f.id === id);
    if (field) {
      updatedCustomFields[field.name] = column;
    }
    
    setMappings(prev => ({
      ...prev,
      customFields: updatedCustomFields
    }));
  };

  const addCustomField = () => {
    if (!newCustomFieldName.trim()) {
      return;
    }
    
    const id = `custom-${Date.now()}`;
    const newField = {
      id,
      name: newCustomFieldName.trim(),
      column: ''
    };
    
    setCustomFields(prev => [...prev, newField]);
    setNewCustomFieldName('');
  };

  const removeCustomField = (id: string) => {
    const field = customFields.find(f => f.id === id);
    if (!field) return;
    
    setCustomFields(prev => prev.filter(f => f.id !== id));
    
    // Also remove from mappings
    const updatedCustomFields = { ...mappings.customFields };
    delete updatedCustomFields[field.name];
    
    setMappings(prev => ({
      ...prev,
      customFields: updatedCustomFields
    }));
  };

  const handleSave = () => {
    // Validate that email is mapped
    if (!mappings.email) {
      setError('E-Mail-Spalte muss zugeordnet werden.');
      return;
    }
    
    // Update custom fields in mappings
    const updatedCustomFields: Record<string, string> = {};
    customFields.forEach(field => {
      if (field.column) {
        updatedCustomFields[field.name] = field.column;
      }
    });
    
    const finalMappings = {
      ...mappings,
      customFields: updatedCustomFields
    };
    
    onSave(finalMappings, file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">CSV-Spalten zuordnen</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-grow overflow-hidden">
          {processing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
              <p className="mt-4 text-gray-600">CSV-Datei wird verarbeitet...</p>
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4 flex items-start">
                <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              {/* CSV Data Preview - Left Side */}
              <div className="w-1/2 overflow-y-auto border-r p-4">
                <h3 className="text-lg font-medium mb-3">CSV-Daten Vorschau</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map((header, index) => (
                          <th 
                            key={index}
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r last:border-r-0"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {row.map((cell, cellIndex) => (
                            <td 
                              key={cellIndex}
                              className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 border-r last:border-r-0 max-w-xs truncate"
                              title={cell}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mapping Controls - Right Side */}
              <div className="w-1/2 overflow-y-auto p-4">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Standard-Felder zuordnen</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-Mail <span className="text-red-500">*</span>
                      </label>
                      <select 
                        value={mappings.email || ''} 
                        onChange={(e) => handleMappingChange('email', e.target.value)}
                        className="select w-full"
                        required
                      >
                        <option value="">-- Bitte wählen --</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vorname
                      </label>
                      <select 
                        value={mappings.first_name || ''} 
                        onChange={(e) => handleMappingChange('first_name', e.target.value)}
                        className="select w-full"
                      >
                        <option value="">-- Nicht zuordnen --</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nachname
                      </label>
                      <select 
                        value={mappings.last_name || ''} 
                        onChange={(e) => handleMappingChange('last_name', e.target.value)}
                        className="select w-full"
                      >
                        <option value="">-- Nicht zuordnen --</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Firmenname
                      </label>
                      <select 
                        value={mappings.company_name || ''} 
                        onChange={(e) => handleMappingChange('company_name', e                        value', e.target.value)}
                        className="select w-full"
                      >
                        <option value="">-- Nicht zuordnen --</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL / Website
                      </label>
                      <select 
                        value={mappings.url || ''} 
                        onChange={(e) => handleMappingChange('url', e.target.value)}
                        className="select w-full"
                      >
                        <option value="">-- Nicht zuordnen --</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ansprache
                      </label>
                      <select 
                        value={mappings.salutation || ''} 
                        onChange={(e) => handleMappingChange('salutation', e.target.value)}
                        className="select w-full"
                      >
                        <option value="">-- Nicht zuordnen --</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-Mail Ansprache
                      </label>
                      <select 
                        value={mappings.email_salutation || ''} 
                        onChange={(e) => handleMappingChange('email_salutation', e.target.value)}
                        className="select w-full"
                      >
                        <option value="">-- Nicht zuordnen --</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Benutzerdefinierte Felder</h3>
                  <div className="space-y-3">
                    {customFields.map((field) => (
                      <div key={field.id} className="flex items-center space-x-3">
                        <div className="flex-grow">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.name}
                          </label>
                          <select 
                            value={field.column || ''} 
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            className="select w-full"
                          >
                            <option value="">-- Nicht zuordnen --</option>
                            {headers.map((header, index) => (
                              <option key={index} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button 
                          onClick={() => removeCustomField(field.id)}
                          className="mt-6 text-red-500 hover:text-red-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex items-end space-x-2 pt-2">
                      <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Neues benutzerdefiniertes Feld
                        </label>
                        <input 
                          type="text" 
                          value={newCustomFieldName}
                          onChange={(e) => setNewCustomFieldName(e.target.value)}
                          placeholder="Feldname eingeben"
                          className="input w-full"
                        />
                      </div>
                      <button 
                        onClick={addCustomField}
                        disabled={!newCustomFieldName.trim()}
                        className="btn btn-secondary px-4 py-2"
                      >
                        Hinzufügen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end space-x-3 bg-gray-50">
          <button 
            onClick={onClose}
            className="btn btn-secondary"
          >
            Abbrechen
          </button>
          <button 
            onClick={handleSave}
            disabled={processing || !mappings.email}
            className="btn btn-primary flex items-center"
          >
            <Save size={18} className="mr-2" />
            Zuordnungen speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default CSVMappingModal;
