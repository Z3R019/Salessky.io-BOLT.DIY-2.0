import React from 'react';
import { Check } from 'lucide-react';

interface PlanCardProps {
  name: string;
  price: number | null;
  currency?: string;
  interval?: string;
  features: string[];
  isPopular?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  currency = 'EUR',
  interval = 'month',
  features,
  isPopular = false,
  isSelected = false,
  onSelect
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <div 
      className={`border rounded-lg p-6 transition-all ${
        isSelected 
          ? 'border-secondary-500 ring-2 ring-secondary-200' 
          : 'hover:border-secondary-200'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <h4 className="text-lg font-semibold">{name}</h4>
            {isPopular && (
              <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded">
                Beliebt
              </span>
            )}
          </div>
          <p className="text-2xl font-bold mt-2">
            {price !== null ? (
              <>
                {formatPrice(price)} <span className="text-sm font-normal text-gray-500">/{interval}</span>
              </>
            ) : (
              'Individuell'
            )}
          </p>
        </div>
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
          isSelected 
            ? 'border-secondary-500 bg-secondary-500' 
            : 'border-gray-300'
        }`}>
          {isSelected && (
            <Check size={14} className="text-white" />
          )}
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>
      
      <button 
        className={`w-full mt-6 py-2 rounded-md font-medium ${
          isSelected 
            ? 'bg-secondary-500 text-white hover:bg-secondary-600' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        onClick={onSelect}
      >
        {isSelected ? 'Ausgewählt' : 'Auswählen'}
      </button>
    </div>
  );
};

export default PlanCard;
