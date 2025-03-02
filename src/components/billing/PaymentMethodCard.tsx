import React from 'react';
import { CreditCard, Edit } from 'lucide-react';

interface PaymentMethodProps {
  type: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  onEdit: () => void;
}

const PaymentMethodCard: React.FC<PaymentMethodProps> = ({
  type,
  last4,
  expiryMonth,
  expiryYear,
  onEdit
}) => {
  const getCardIcon = () => {
    switch (type.toLowerCase()) {
      case 'visa':
        return <CreditCard className="h-6 w-6 text-blue-600" />;
      case 'mastercard':
        return <CreditCard className="h-6 w-6 text-red-600" />;
      case 'amex':
        return <CreditCard className="h-6 w-6 text-purple-600" />;
      default:
        return <CreditCard className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatExpiryDate = (month: number, year: number) => {
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedYear = year.toString().slice(-2);
    return `${formattedMonth}/${formattedYear}`;
  };

  return (
    <div className="border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="bg-gray-100 p-2 rounded">
          {getCardIcon()}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{type} endend auf {last4}</p>
          <p className="text-xs text-gray-500">Läuft ab: {formatExpiryDate(expiryMonth, expiryYear)}</p>
        </div>
      </div>
      <button 
        className="text-secondary-600 hover:text-secondary-800 text-sm font-medium flex items-center"
        onClick={onEdit}
      >
        <Edit size={16} className="mr-1" />
        Bearbeiten
      </button>
    </div>
  );
};

export default PaymentMethodCard;
