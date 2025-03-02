import React, { useState, useEffect } from 'react';
import { 
  Plus, AtSign, Mail, Check, X, Eye, EyeOff, ExternalLink, Send,
  AlertCircle, Trash2, Mail as MailIcon, 
  Globe, Server, Chrome, MessageCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Tables } from '../../lib/database.types';
import { format } from 'date-fns';
import { useSupabaseSync } from '../../hooks/useSupabaseSync';
import { supabaseSync } from '../../lib/supabaseSync';
import { sendTestEmail } from '../../services/emailService';

type EmailAccount = Tables<'email_accounts'>;
type EmailProvider = {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'oauth' | 'smtp' | 'api';
  smtpHost?: string;
  smtpPort?: number;
  imapHost?: string;
  imapPort?: number;
  securityTypes?: string[];
};

const AccountsPage: React.FC = () => {
  const { user } = useAuth();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [accountConfig, setAccountConfig] = useState({
    smtpHost: '',
    smtpPort: '',
    smtpUsername: '',
    smtpPassword: '',
    smtpSecurity: 'SSL',
    imapHost: '',
    imapPort: '',
    imapUsername: '',
    imapPassword: '',
    imapSecurity: 'SSL'
  });

  // Use Supabase sync for realtime updates
  const { data: accounts, isLoading, updateLocalData } = useSupabaseSync<EmailAccount>({
    table: 'email_accounts',
    filter: user ? supabaseSync.filterByUserId(user.id) : undefined,
    enabled: !!user
  });

  // Email providers data with icons - reduced to Gmail, Outlook and Custom SMTP
  const emailProviders: EmailProvider[] = [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: <Chrome className="h-10 w-10 text-red-500" />,
      type: 'smtp',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      securityTypes: ['SSL', 'TLS']
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: <MessageCircle className="h-10 w-10 text-blue-500" />,
      type: 'smtp',
      smtpHost: 'smtp-mail.outlook.com',
      smtpPort: 587,
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      securityTypes: ['SSL', 'TLS']
    },
    {
      id: 'custom',
      name: 'Andere SMTP',
      icon: <Server className="h-10 w-10 text-gray-500" />,
      type: 'smtp',
      securityTypes: ['SSL', 'TLS', 'STARTTLS', 'None']
    }
  ];

  // Reset form when closing add account modal
  const handleCloseModal = () => {
    setShowAddAccount(false);
    setCurrentStep(1);
    setSelectedProvider(null);
    setNewEmail('');
    setNewName('');
    setTestEmail('');
    setTestEmailSent(false);
    setAccountId(null);
    setAccountConfig({
      smtpHost: '',
      smtpPort: '',
      smtpUsername: '',
      smtpPassword: '',
      smtpSecurity: 'SSL',
      imapHost: '',
      imapPort: '',
      imapUsername: '',
      imapPassword: '',
      imapSecurity: 'SSL'
    });
    setError(null);
    setSuccess(null);
  };

  // Handle provider selection
  const handleProviderSelect = (provider: EmailProvider) => {
    setSelectedProvider(provider);
    
    // Pre-fill SMTP/IMAP settings if provider is known
    if (provider.smtpHost) {
      setAccountConfig(prev => ({
        ...prev,
        smtpHost: provider.smtpHost || '',
        smtpPort: provider.smtpPort?.toString() || '',
        imapHost: provider.imapHost || '',
        imapPort: provider.imapPort?.toString() || '',
      }));
    }
    
    // No longer automatically go to next step
  };

  // Handle form value changes
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAccountConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Move to next step with validation
  const goToNextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!selectedProvider) {
        setError('Bitte wählen Sie einen E-Mail-Provider aus.');
        return;
      }
    } else if (currentStep === 2) {
      if (!newEmail || !newName) {
        setError('Bitte geben Sie eine E-Mail-Adresse und einen Namen ein.');
        return;
      }
      
      // Auto-fill username fields with email if empty
      if (!accountConfig.smtpUsername) {
        setAccountConfig(prev => ({
          ...prev,
          smtpUsername: newEmail,
          imapUsername: newEmail
        }));
      }
    }
    
    if (currentStep === 3) {
      // Create the account but keep status as pending
      handleCreateAccount();
    } else {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  // Go back to previous step
  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };

  // Create account in database with "pending" status
  const handleCreateAccount = async () => {
    if (!selectedProvider || !newEmail || !newName || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate SMTP settings
      if (selectedProvider.type === 'smtp' && 
          (!accountConfig.smtpHost || !accountConfig.smtpPort || 
           !accountConfig.smtpUsername || !accountConfig.smtpPassword)) {
        setError('Bitte füllen Sie alle SMTP-Einstellungen aus.');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('email_accounts')
        .insert({
          user_id: user.id,
          email: newEmail,
          name: newName,
          provider: selectedProvider.name,
          status: 'pending',
          provider_type: selectedProvider.type,
          // Provider icon identifier, not the actual component
          provider_logo: selectedProvider.id,
          // SMTP settings
          smtp_host: accountConfig.smtpHost,
          smtp_port: parseInt(accountConfig.smtpPort) || null,
          smtp_username: accountConfig.smtpUsername,
          smtp_password: accountConfig.smtpPassword,
          smtp_security: accountConfig.smtpSecurity,
          // IMAP settings
          imap_host: accountConfig.imapHost,
          imap_port: parseInt(accountConfig.imapPort) || null,
          imap_username: accountConfig.imapUsername,
          imap_password: accountConfig.imapPassword,
          imap_security: accountConfig.imapSecurity
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Save the account ID to update later
      setAccountId(data.id);
      
      // Move to the next step
      setCurrentStep(4);
    } catch (err) {
      console.error('Error adding account:', err);
      setError('Fehler beim Hinzufügen des E-Mail-Accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Möchten Sie diesen E-Mail-Account wirklich entfernen?')) {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('email_accounts')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }
      } catch (err) {
        console.error('Error deleting account:', err);
        setError('Fehler beim Entfernen des E-Mail-Accounts.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Send test email using our email service
  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setError('Bitte geben Sie eine E-Mail-Adresse für den Test ein.');
      return;
    }
    
    if (!accountId) {
      setError('Fehler: Konto-ID fehlt. Bitte versuchen Sie es erneut.');
      return;
    }
    
    try {
      setLoading(true);
      setIsSendingTestEmail(true);
      setError(null);
      setSuccess(null);
      
      // Get account details from Supabase
      const { data: account, error: accountError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (accountError || !account) {
        throw new Error('Fehler beim Laden der Account-Daten');
      }
      
      // Send the test email using our email service
      const result = await sendTestEmail(account, testEmail);
      
      if (!result.success) {
        throw new Error(result.message || 'E-Mail konnte nicht gesendet werden');
      }
      
      setSuccess(`Test-E-Mail wurde an ${testEmail} gesendet. Bitte überprüfen Sie Ihren Posteingang und ggf. den Spam-Ordner.`);
      setTestEmailSent(true);
    } catch (err) {
      console.error('Error sending test email:', err);
      setError(`Fehler beim Senden der Test-E-Mail: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
      setIsSendingTestEmail(false);
    }
  };

  // Confirm email received and update status
  const handleConfirmEmailReceived = async () => {
    if (!accountId) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('email_accounts')
        .update({ status: 'active' })
        .eq('id', accountId);
      
      if (error) {
        throw error;
      }
      
      setSuccess('E-Mail-Account wurde erfolgreich verbunden!');
      
      // Close the modal after a short delay
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (err) {
      console.error('Error updating account status:', err);
      setError('Fehler beim Aktualisieren des Account-Status.');
    } finally {
      setLoading(false);
    }
  };

  // Handle email not received
  const handleEmailNotReceived = () => {
    setError('Die Test-E-Mail ist nicht angekommen. Bitte überprüfen Sie Ihre SMTP-Einstellungen oder versuchen Sie es erneut.');
    setTestEmailSent(false);
  };

  // Render provider icon from ID
  const renderProviderIcon = (providerId: string) => {
    const provider = emailProviders.find(p => p.id === providerId);
    
    if (provider) {
      return provider.icon;
    }
    
    // Fallback to server icon
    return <Server className="h-6 w-6 text-gray-500" />;
  };

  // Render status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Erfolgreich verbunden</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inaktiv</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Ausstehend</span>;
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">1. E-Mail-Provider auswählen</h3>
            <p className="text-sm text-gray-500 mb-4">
              Wählen Sie Ihren E-Mail-Provider aus der Liste aus oder wählen Sie "Andere SMTP", wenn Ihr Provider nicht aufgeführt ist.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {emailProviders.map((provider) => (
                <div 
                  key={provider.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors hover:border-secondary-300 ${
                    selectedProvider?.id === provider.id 
                      ? 'border-secondary-500 bg-secondary-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleProviderSelect(provider)}
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex items-center justify-center h-12 w-12">
                      {provider.icon}
                    </div>
                    <span className="text-sm font-medium">{provider.name}</span>
                    {selectedProvider?.id === provider.id && (
                      <Check size={18} className="text-secondary-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">2. Kontoinformationen</h3>
            <p className="text-sm text-gray-500 mb-4">
              Geben Sie die E-Mail-Adresse und den Anzeigenamen ein, den Sie für diesen Account verwenden möchten.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  type="email"
                  className="input w-full"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ihre.email@beispiel.de"                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Anzeigename
                </label>
                <input
                  id="name"
                  type="text"
                  className="input w-full"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Max Mustermann"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Dies ist der Name, den Empfänger Ihrer E-Mails sehen werden.
                </p>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">3. Server-Einstellungen</h3>
            <p className="text-sm text-gray-500 mb-4">
              Geben Sie die SMTP- und IMAP-Server-Einstellungen für Ihren E-Mail-Account ein.
            </p>
            
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h4 className="text-md font-medium mb-3">SMTP-Einstellungen (Zum Senden von E-Mails)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Server
                  </label>
                  <input
                    id="smtpHost"
                    name="smtpHost"
                    type="text"
                    className="input w-full"
                    value={accountConfig.smtpHost}
                    onChange={handleConfigChange}
                    placeholder="smtp.provider.com"
                  />
                </div>
                <div>
                  <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Port
                  </label>
                  <input
                    id="smtpPort"
                    name="smtpPort"
                    type="text"
                    className="input w-full"
                    value={accountConfig.smtpPort}
                    onChange={handleConfigChange}
                    placeholder="587"
                  />
                </div>
                <div>
                  <label htmlFor="smtpUsername" className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Benutzername
                  </label>
                  <input
                    id="smtpUsername"
                    name="smtpUsername"
                    type="text"
                    className="input w-full"
                    value={accountConfig.smtpUsername}
                    onChange={handleConfigChange}
                    placeholder="Normalerweise Ihre E-Mail-Adresse"
                  />
                </div>
                <div>
                  <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Passwort
                  </label>
                  <div className="relative">
                    <input
                      id="smtpPassword"
                      name="smtpPassword"
                      type={showPassword ? "text" : "password"}
                      className="input w-full pr-10"
                      value={accountConfig.smtpPassword}
                      onChange={handleConfigChange}
                      placeholder="Ihr Passwort"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={18} className="text-gray-400" />
                      ) : (
                        <Eye size={18} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="smtpSecurity" className="block text-sm font-medium text-gray-700 mb-1">
                    Sicherheit
                  </label>
                  <select
                    id="smtpSecurity"
                    name="smtpSecurity"
                    className="input w-full"
                    value={accountConfig.smtpSecurity}
                    onChange={handleConfigChange}
                  >
                    {selectedProvider?.securityTypes?.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium mb-3">IMAP-Einstellungen (Optional - Zum Lesen von E-Mails)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="imapHost" className="block text-sm font-medium text-gray-700 mb-1">
                    IMAP Server
                  </label>
                  <input
                    id="imapHost"
                    name="imapHost"
                    type="text"
                    className="input w-full"
                    value={accountConfig.imapHost}
                    onChange={handleConfigChange}
                    placeholder="imap.provider.com"
                  />
                </div>
                <div>
                  <label htmlFor="imapPort" className="block text-sm font-medium text-gray-700 mb-1">
                    IMAP Port
                  </label>
                  <input
                    id="imapPort"
                    name="imapPort"
                    type="text"
                    className="input w-full"
                    value={accountConfig.imapPort}
                    onChange={handleConfigChange}
                    placeholder="993"
                  />
                </div>
                <div>
                  <label htmlFor="imapUsername" className="block text-sm font-medium text-gray-700 mb-1">
                    IMAP Benutzername
                  </label>
                  <input
                    id="imapUsername"
                    name="imapUsername"
                    type="text"
                    className="input w-full"
                    value={accountConfig.imapUsername}
                    onChange={handleConfigChange}
                    placeholder="Normalerweise Ihre E-Mail-Adresse"
                  />
                </div>
                <div>
                  <label htmlFor="imapPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    IMAP Passwort
                  </label>
                  <div className="relative">
                    <input
                      id="imapPassword"
                      name="imapPassword"
                      type={showPassword ? "text" : "password"}
                      className="input w-full pr-10"
                      value={accountConfig.imapPassword}
                      onChange={handleConfigChange}
                      placeholder="Ihr Passwort"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={18} className="text-gray-400" />
                      ) : (
                        <Eye size={18} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="imapSecurity" className="block text-sm font-medium text-gray-700 mb-1">
                    Sicherheit
                  </label>
                  <select
                    id="imapSecurity"
                    name="imapSecurity"
                    className="input w-full"
                    value={accountConfig.imapSecurity}
                    onChange={handleConfigChange}
                  >
                    {selectedProvider?.securityTypes?.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">4. E-Mail-Verbindung testen</h3>
            <p className="text-sm text-gray-500 mb-4">
              Um sicherzustellen, dass Ihr E-Mail-Account korrekt eingerichtet ist, senden wir eine Test-E-Mail.
              Bitte geben Sie eine E-Mail-Adresse ein, an die wir die Test-Nachricht senden sollen.
            </p>
            
            {!testEmailSent ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Test-E-Mail senden an
                  </label>
                  <input
                    id="testEmail"
                    type="email"
                    className="input w-full"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@beispiel.de"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Idealerweise verwenden Sie eine andere E-Mail-Adresse, zu der Sie Zugang haben.
                  </p>
                </div>
                
                <div>
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleSendTestEmail}
                    disabled={loading || isSendingTestEmail}
                  >
                    <Send size={18} className="mr-2" />
                    {isSendingTestEmail ? 'Wird gesendet...' : 'Test-E-Mail senden'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle size={20} className="text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">E-Mail wurde gesendet</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Bitte überprüfen Sie Ihren Posteingang (und ggf. den Spam-Ordner) für die Test-E-Mail.
                        Haben Sie die E-Mail erhalten?
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleConfirmEmailReceived}
                    disabled={loading}
                  >
                    <Check size={18} className="mr-2" />
                    Ja, E-Mail erhalten
                  </button>
                  
                  <button
                    type="button"                    
                    className="btn btn-secondary flex items-center"
                    onClick={handleEmailNotReceived}
                    disabled={loading}
                  >
                    <X size={18} className="mr-2" />
                    Nein, keine E-Mail erhalten
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">E-Mail Accounts</h1>
          <p className="text-gray-600 mt-1">Verwalten Sie Ihre E-Mail-Konten für den Versand von Kampagnen</p>
        </div>
        <button 
          className="btn btn-primary flex items-center"
          onClick={() => setShowAddAccount(true)}
        >
          <Plus size={18} className="mr-2" />
          Neuen Account hinzufügen
        </button>
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

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">E-Mail-Account hinzufügen</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={handleCloseModal}
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Stepper */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 1 ? 'bg-secondary-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep >= 2 ? 'bg-secondary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 2 ? 'bg-secondary-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep >= 3 ? 'bg-secondary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 3 ? 'bg-secondary-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep >= 4 ? 'bg-secondary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 4 ? 'bg-secondary-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  4
                </div>
              </div>
            </div>
            
            {/* Step Content */}
            <div className="p-6">
              {renderStepContent()}
            </div>
            
            {/* Action Buttons */}
            <div className="p-6 border-t flex justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={goToPreviousStep}
                  disabled={loading}
                >
                  Zurück
                </button>
              ) : (
                <div></div>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={goToNextStep}
                  disabled={loading}
                >
                  Weiter
                </button>
              ) : currentStep === 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={goToNextStep}
                  disabled={loading}
                >
                  {loading ? 'Wird erstellt...' : 'Account erstellen & testen'}
                </button>
              ) : testEmailSent ? (
                null // No next button when awaiting confirmation
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Überspringen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Meine E-Mail-Accounts</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Daten werden geladen...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-700">Keine E-Mail-Accounts vorhanden</h3>
            <p className="mt-1 text-sm text-gray-500">Fügen Sie Ihren ersten E-Mail-Account hinzu, um Kampagnen zu versenden.</p>
            <div className="mt-6">
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddAccount(true)}
              >
                E-Mail-Account hinzufügen
              </button>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-Mail
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hinzugefügt am
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex items-center justify-center mr-2">
                          {renderProviderIcon(account.provider_logo || 'custom')}
                        </div>
                        <div className="text-gray-900">{account.provider}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{account.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{account.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(account.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{formatDate(account.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-secondary-600 hover:text-secondary-800 mr-3"
                        title="Account bearbeiten"
                        disabled={loading}
                      >
                        <ExternalLink size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Account entfernen"
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsPage;
