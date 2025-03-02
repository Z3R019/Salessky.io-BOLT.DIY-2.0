import React from 'react';
import { Search, MoreHorizontal, Edit, Archive, Trash } from 'lucide-react';

interface ImportGroup {
  id: string;
  name: string;
  contactCount: number;
  createdAt: string;
}

interface ImportGroupListProps {
  groups: ImportGroup[];
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onGroupSelect: (id: string) => void;
  selectedGroupId: string | null;
}

const ImportGroupList: React.FC<ImportGroupListProps> = ({ 
  groups, 
  onEdit, 
  onArchive, 
  onDelete,
  onGroupSelect,
  selectedGroupId
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Gruppen durchsuchen..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Keine Import-Gruppen vorhanden.</p>
          <p className="text-gray-500 text-sm mt-1">Laden Sie eine CSV-Datei hoch, um Ihre erste Gruppe zu erstellen.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGroups.map((group) => (
            <div 
              key={group.id} 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedGroupId === group.id ? 'bg-primary-50 border-primary-300' : 'hover:bg-gray-50'
              }`}
              onClick={() => onGroupSelect(group.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    {group.contactCount} Kontakte • Erstellt am {group.createdAt}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(group.id);
                    }}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(group.id);
                    }}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <Archive size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(group.id);
                    }}
                    className="text-gray-500 hover:text-red-600 p-1"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportGroupList;
