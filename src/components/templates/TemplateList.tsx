import React from 'react';
import { Search, MoreHorizontal, Edit, Copy, Trash } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateListProps {
  templates: Template[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ 
  templates, 
  onEdit, 
  onDuplicate, 
  onDelete 
}) => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Vorlagen durchsuchen..."
            className="input pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Keine Vorlagen vorhanden.</p>
          <p className="text-gray-500 text-sm mt-1">Erstellen Sie eine neue Vorlage, um zu beginnen.</p>
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
                  Erstellt am
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zuletzt bearbeitet
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{template.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{template.createdAt}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{template.updatedAt}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => onEdit(template.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => onDuplicate(template.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Copy size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(template.id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TemplateList;
