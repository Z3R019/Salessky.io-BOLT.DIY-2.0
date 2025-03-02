import React from 'react';
import { Check } from 'lucide-react';
import { Assistant } from '../../lib/openai';

interface AssistantSelectionProps {
  assistants: Assistant[];
  selectedAssistantId: string | null;
  onSelect: (assistantId: string) => void;
  isLoading?: boolean;
}

const AssistantSelection: React.FC<AssistantSelectionProps> = ({
  assistants,
  selectedAssistantId,
  onSelect,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-5 h-5 rounded-full border border-gray-300"></div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="h-2 bg-gray-200 rounded w-1/4"></div>
              <div className="h-2 bg-gray-200 rounded w-1/3"></div>
              <div className="h-2 bg-gray-200 rounded w-1/5"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assistants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Keine Assistenten verfügbar.</p>
        </div>
      ) : (
        assistants.map((assistant) => (
          <div 
            key={assistant.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedAssistantId === assistant.id 
                ? 'border-secondary-500 bg-secondary-50' 
                : 'border-gray-200 hover:border-secondary-300'
            }`}
            onClick={() => onSelect(assistant.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {assistant.icon && (
                  <div className="bg-secondary-100 text-secondary-700 p-2 rounded-full mr-3">
                    <span className="material-icons text-xl">{assistant.icon}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{assistant.name}</h3>
                  <p className="text-sm text-gray-500">{assistant.description}</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedAssistantId === assistant.id 
                  ? 'border-secondary-500 bg-secondary-500' 
                  : 'border-gray-300'
              }`}>
                {selectedAssistantId === assistant.id && (
                  <Check size={14} className="text-white" />
                )}
              </div>
            </div>
            
            {/* Capabilities list */}
            {assistant.capabilities && assistant.capabilities.length > 0 && (
              <div className="mt-3 pl-10">
                <p className="text-xs text-gray-500 font-medium mb-1">Fähigkeiten:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                  {assistant.capabilities.map((capability, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-center">
                      <span className="w-1 h-1 bg-secondary-500 rounded-full mr-1.5"></span>
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-2 pl-10 text-xs text-gray-500">
              Model: {assistant.model}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AssistantSelection;
