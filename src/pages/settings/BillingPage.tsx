import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Package, 
  Check, 
  AlertTriangle, 
  ExternalLink,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  stripePromise, 
  createCheckoutSession, 
  createCustomerPortalSession,
  cancelSubscription,
  SUBSCRIPTION_PLANS
} from '../../lib/stripe';
import PlanCard from '../../components/billing/PlanCard';
import UsageStats from '../../components/billing/UsageStats';
import InvoiceList from '../../components/billing/InvoiceList';
import PaymentMethodCard from '../../components/billing/PaymentMethodCard';
import { format, addMonths } from 'date-fns';

interface Invoice {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'failed';
  pdfUrl?: string;
}

const BillingPage: React.FC = () => {
  const { user, userDetails, refreshUserDetails } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'enterprise'>(
    (userDetails?.subscription_plan as 'basic' | 'pro' | 'enterprise') || 'basic'
  );
  
  // Mock data for demo purposes
  const [usageStats, setUsageStats] = useState({
    usedLeads: 0,
    maxLeads: 1000,
    usedCampaigns: 0,
    maxCampaigns: 2
  });
  
  const [paymentMethod, setPaymentMethod] = useState({
    type: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025
  });
  
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv_1',
      date: new Date(2025, 3, 15), // April 15, 2025
      amount: 500,
      currency: 'EUR',
      status: 'paid',
      pdfUrl: '#'
    },
    {
      id: 'inv_2',
      date: new Date(2025, 2, 15), // March 15, 2025
      amount: 500,
      currency: 'EUR',
      status: 'paid',
      pdfUrl: '#'
    }
  ]);

  useEffect(() => {
    if (user) {
      fetchBillingData();
    }
  }, [user]);

  useEffect(() => {
    if (userDetails?.subscription_plan) {
      setSelectedPlan(userDetails.subscription_plan as 'basic' | 'pro' | 'enterprise');
      
      // Update usage limits based on plan
      const planLimits = SUBSCRIPTION_PLANS[userDetails.subscription_plan as 'basic' | 'pro' | 'enterprise']?.limits;
      if (planLimits) {
        setUsageStats(prev => ({
          ...prev,
          maxLeads: planLimits.maxLeads,
          maxCampaigns: planLimits.maxCampaigns
        }));
      }
    }
  }, [userDetails]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, you would fetch this data from your database
      // For demo purposes, we'll simulate some usage data
      
      // Fetch lead count
      const { count: leadsCount, error: leadsError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', 'in', (query) => {
          query
            .select('id')
            .from('lead_groups')
            .eq('user_id', user?.id);
        });
        
      if (leadsError) {
        console.error('Error fetching leads count:', leadsError);
      } else {
        setUsageStats(prev => ({
          ...prev,
          usedLeads: leadsCount || 0
        }));
      }
      
      // Fetch active campaigns count
      const { count: campaignsCount, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .in('status', ['draft', 'scheduled', 'running']);
        
      if (campaignsError) {
        console.error('Error fetching campaigns count:', campaignsError);
      } else {
        setUsageStats(prev => ({
          ...prev,
          usedCampaigns: campaignsCount || 0
        }));
      }
      
      // In a real app, you would fetch invoices and payment methods from Stripe
      // For demo purposes, we'll use mock data
      
      await refreshUserDetails();
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Fehler beim Laden der Abrechnungsdaten.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = () => {
    setShowChangePlanModal(true);
  };

  const handlePlanSelect = (plan: 'basic' | 'pro' | 'enterprise') => {
    setSelectedPlan(plan);
  };

  const handlePlanChange = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Benutzer nicht angemeldet');
      }
      
      if (selectedPlan === 'enterprise') {
        // For enterprise, redirect to contact page
        setSuccess('Vielen Dank für Ihr Interesse am Enterprise-Plan. Unser Team wird sich in Kürze mit Ihnen in Verbindung setzen.');
        setShowChangePlanModal(false);
        return;
      }
      
      // In a real app, you would create a checkout session with Stripe
      // and redirect the user to the Stripe Checkout page
      
      // For demo purposes, we'll simulate a successful plan change
      const { error } = await supabase
        .from('users')
        .update({
          subscription_plan: selectedPlan,
          subscription_status: 'active',
          subscription_period_end: addMonths(new Date(), 1).toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      await refreshUserDetails();
      
      setSuccess(`Ihr Plan wurde erfolgreich auf ${SUBSCRIPTION_PLANS[selectedPlan].name} geändert.`);
      setShowChangePlanModal(false);
    } catch (err) {
      console.error('Error changing plan:', err);
      setError('Fehler beim Ändern des Plans. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || !userDetails?.subscription_id) {
        throw new Error('Keine aktive Abonnement gefunden');
      }
      
      // In a real app, you would cancel the subscription with Stripe
      // For demo purposes, we'll simulate a successful cancellation
      
      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
          is_active: false
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      await refreshUserDetails();
      
      setSuccess('Ihr Abonnement wurde erfolgreich gekündigt. Ihr Zugang bleibt bis zum Ende der aktuellen Abrechnungsperiode aktiv.');
      setShowCancelConfirm(false);
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError('Fehler beim Kündigen des Abonnements. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleManagePaymentMethod = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Benutzer nicht angemeldet');
      }
      
      // In a real app, you would create a customer portal session with Stripe
      // and redirect the user to the Stripe Customer Portal
      
      // For demo purposes, we'll just show a success message
      setSuccess('In einer echten Implementierung würden Sie zum Stripe Customer Portal weitergeleitet werden, um Ihre Zahlungsmethoden zu verwalten.');
    } catch (err) {
      console.error('Error managing payment method:', err);
      setError('Fehler beim Öffnen des Zahlungsmethoden-Managers. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nicht verfügbar';
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Abrechnung</h1>
        <p className="text-gray-600 mt-1">Verwalten Sie Ihr Abonnement und Ihre Zahlungsinformationen</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Aktueller Plan</h2>
              <div className={`px-2 py-1 text-xs rounded-full ${
                userDetails?.subscription_status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : userDetails?.subscription_status === 'canceled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {userDetails?.subscription_status === 'active' 
                  ? 'Aktiv' 
                  : userDetails?.subscription_status === 'canceled'
                  ? 'Gekündigt'
                  : 'Test'}
              </div>
            </div>
            
            <div className="flex items-center mb-4">
              <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded text-sm font-medium">
                {userDetails?.subscription_plan === 'basic' && 'Basic Plan'}
                {userDetails?.subscription_plan === 'pro' && 'Pro Plan'}
                {userDetails?.subscription_plan === 'enterprise' && 'Enterprise Plan'}
              </div>
              <span className="ml-2 text-sm text-gray-500">
                {userDetails?.subscription_plan === 'basic' && '200,00 € / Monat'}
                {userDetails?.subscription_plan === 'pro' && '500,00 € / Monat'}
                {userDetails?.subscription_plan === 'enterprise' && 'Individuell'}
              </span>
            </div>
            
            {userDetails?.subscription_period_end && (
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar size={16} className="mr-2" />
                Nächste Abrechnung am {formatDate(userDetails.subscription_period_end)}
              </div>
            )}
            
            <div className="flex mt-4">
              <button 
                className="btn btn-secondary mr-2"
                onClick={handleChangePlan}
              >
                Plan ändern
              </button>
              {userDetails?.subscription_status === 'active' && (
                <button 
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Kündigen
                </button>
              )}
              {userDetails?.subscription_status === 'canceled' && (
                <button 
                  className="text-secondary-600 hover:text-secondary-800 text-sm font-medium"
                  onClick={handleChangePlan}
                >
                  Reaktivieren
                </button>
              )}
            </div>
          </div>
          
          {/* Usage Stats */}
          <UsageStats 
            plan={userDetails?.subscription_plan || 'basic'}
            usedLeads={usageStats.usedLeads}
            maxLeads={usageStats.maxLeads}
            usedCampaigns={usageStats.usedCampaigns}
            maxCampaigns={usageStats.maxCampaigns}
          />
        </div>
        
        {/* Payment Method */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Zahlungsmethode</h2>
            <PaymentMethodCard 
              type={paymentMethod.type}
              last4={paymentMethod.last4}
              expiryMonth={paymentMethod.expiryMonth}
              expiryYear={paymentMethod.expiryYear}
              onEdit={handleManagePaymentMethod}
            />
          </div>
        </div>
      </div>
      
      {/* Invoices */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Rechnungen</h2>
        {invoices.length > 0 ? (
          <InvoiceList invoices={invoices} />
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">Keine Rechnungen vorhanden</p>
          </div>
        )}
      </div>
      
      {/* Change Plan Modal */}
      {showChangePlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Plan ändern</h2>
              <p className="text-gray-600 mt-1">Wählen Sie den Plan, der am besten zu Ihren Bedürfnissen passt</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PlanCard 
                  name="Basic Plan"
                  price={200}
                  features={SUBSCRIPTION_PLANS.basic.features}
                  isSelected={selectedPlan === 'basic'}
                  onSelect={() => handlePlanSelect('basic')}
                />
                
                <PlanCard 
                  name="Pro Plan"
                  price={500}
                  features={SUBSCRIPTION_PLANS.pro.features}
                  isPopular={true}
                  isSelected={selectedPlan === 'pro'}
                  onSelect={() => handlePlanSelect('pro')}
                />
                
                <PlanCard 
                  name="Enterprise Plan"
                  price={null}
                  features={SUBSCRIPTION_PLANS.enterprise.features}
                  isSelected={selectedPlan === 'enterprise'}
                  onSelect={() => handlePlanSelect('enterprise')}
                />
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end">
              <button 
                className="btn btn-secondary mr-2"
                onClick={() => setShowChangePlanModal(false)}
              >
                Abbrechen
              </button>
              <button 
                className="btn btn-primary"
                onClick={handlePlanChange}
                disabled={loading}
              >
                {loading ? 'Wird geändert...' : 'Plan ändern'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Abonnement kündigen</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Sind Sie sicher, dass Sie Ihr Abonnement kündigen möchten? Ihr Zugang bleibt bis zum Ende der aktuellen Abrechnungsperiode aktiv. Danach wird Ihr Account deaktiviert.
                  </p>
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Wichtig:</strong> Nach der Deaktivierung können Sie nicht mehr auf Ihre Daten zugreifen. Sie können Ihr Abonnement jederzeit vor Ablauf der Periode reaktivieren.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
              <button 
                className="btn btn-secondary mr-2"
                onClick={() => setShowCancelConfirm(false)}
              >
                Abbrechen
              </button>
              <button 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
                onClick={handleCancelSubscription}
                disabled={loading}
              >
                {loading ? 'Wird gekündigt...' : 'Kündigen bestätigen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
