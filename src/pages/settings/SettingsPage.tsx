import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Save, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'integrations' | 'apikeys'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    company_website: '',
    company_address: '',
    company_zip: '',
    company_city: '',
    company_phone: '',
    company_description: '',
    email_signature: '',
    openai_api_key: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserSettings();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setLoading(false);
        throw new Error('Kein Benutzer gefunden');
      }

      console.log('Fetching user settings for user ID:', user.id);

      // Check if user record exists
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user settings:', error);
        throw new Error('Fehler beim Laden der Einstellungen.');
      }

      console.log('User data from database:', data);

      if (data) {
        // User record exists, set form data
        setFormData({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          company_name: data.company_name ?? '',
          company_website: data.company_website ?? '',
          company_address: data.company_address ?? '',
          company_zip: data.company_zip ?? '',
          company_city: data.company_city ?? '',
          company_phone: data.company_phone ?? '',
          company_description: data.company_description ?? '',
          email_signature: data.email_signature ?? '',
          openai_api_key: data.openai_api_key ?? ''
        });
      } else {
        console.log('No user record found, creating one');
        // User record doesn't exist, create one
        await createUserRecord();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Einstellungen. Bitte versuchen Sie es später erneut.';
      console.error('Error fetching user settings:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createUserRecord = async () => {
    if (!user) return;
    
    try {
      console.log('Creating new user record for user ID:', user.id);
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          first_name: '',
          last_name: '',
          company_name: '',
          company_website: '',
          company_address: '',
          company_zip: '',
          company_city: '',
          company_phone: '',
          company_description: '',
          email_signature: '',
          openai_api_key: '',
          is_active: true
        });
      
      if (error) {
        console.error('Error creating user record:', error);
        throw new Error('Fehler beim Erstellen des Benutzerprofils.');
      }
      
      console.log('User record created successfully');
      
      // Set default form data
      setFormData({
        first_name: '',
        last_name: '',
        company_name: '',
        company_website: '',
        company_address: '',
        company_zip: '',
        company_city: '',
        company_phone: '',
        company_description: '',
        email_signature: '',
        openai_api_key: ''
      });
    } catch (err) {
      console.error('Error creating user record:', err);
      throw err;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!user) {
        setLoading(false);
        throw new Error('Kein Benutzer gefunden');
      }

      console.log('Saving settings for user ID:', user.id);

      // Check if user record exists
      const { data, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking if user exists:', checkError);
        throw new Error('Fehler beim Überprüfen des Benutzerprofils.');
      }
      
      if (!data) {
        console.log('User does not exist, creating record');
        // User doesn't exist, create record
        await createUserRecord();
      }

      // Make a copy of formData for update
      const updateData = { ...formData };
      
      console.log('Updating user with data:', updateData);

      // Update user settings
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error saving settings:', error);
        throw new Error(`Fehler beim Speichern der Einstellungen: ${error.message}`);
      }

      console.log('Settings saved successfully');
      setSuccess('Einstellungen wurden erfolgreich gespeichert.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Speichern der Einstellungen.';
      console.error('Error saving settings:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Verwalten Sie Ihre Konto- und Unternehmenseinstellungen</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex -mb-px">
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profil
          </button>
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'company'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('company')}
          >
            Unternehmen
          </button>
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'apikeys'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('apikeys')}
          >
            API-Schlüssel
          </button>
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'integrations'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('integrations')}
          >
            Integrationen
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Profileinstellungen</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vorname
                  </label>
                  <input
                    id="first-name"
                    name="first_name"
                    type="text"
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.first_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nachname
                  </label>
                  <input
                    id="last-name"
                    name="last_name"
                    type="text"
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.last_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-Mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Passwort ändern</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Aktuelles Passwort
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Neues Passwort
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  type="button" 
                  className="btn btn-primary flex items-center"
                  onClick={handleSaveSettings}
                  disabled={loading}
                >
                  <Save size={18} className="mr-2" />
                  {loading ? 'Wird gespeichert...' : 'Änderungen speichern'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'company' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Unternehmensinfos</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unternehmensname
                  </label>
                  <input
                    id="company-name"
                    name="company_name"
                    type="text"
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.company_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    id="website"
                    name="company_website"
                    type="url"
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.company_website}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adresse
                  </label>
                  <input
                    id="address"
                    name="company_address"
                    type="text"
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.company_address}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      PLZ
                    </label>
                    <input
                      id="zip"
                      name="company_zip"
                      type="text"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.company_zip}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ort
                    </label>                    <input
                      id="city"
                      name="company_city"
                      type="text"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.company_city}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="company-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefonnummer
                  </label>
                  <input
                    id="company-phone"
                    name="company_phone"
                    type="tel"
                    className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.company_phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="company-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unternehmensbeschreibung
                </label>
                <textarea
                  id="company-description"
                  name="company_description"
                  rows={4}
                  className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.company_description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="email-signature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-Mail-Signatur
                </label>
                <textarea
                  id="email-signature"
                  name="email_signature"
                  rows={4}
                  className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.email_signature}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Diese Signatur wird automatisch an Ihre E-Mails angehängt.
                </p>
              </div>
              
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="btn btn-primary flex items-center"
                >
                  <Save size={18} className="mr-2" />
                  {loading ? 'Wird gespeichert...' : 'Änderungen speichern'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apikeys' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">API-Schlüssel</h2>
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-500 px-4 py-3 rounded mb-6">
                <h3 className="text-sm font-medium">Sicherheitshinweis</h3>
                <p className="mt-1 text-sm">
                  Ihr OpenAI API-Schlüssel wird verschlüsselt gespeichert und nur für Ihre KI-Assistenten verwendet.
                  Wir haben niemals direkten Zugriff auf Ihren Schlüssel.
                </p>
              </div>
              
              <div>
                <label htmlFor="openai-api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  OpenAI API-Schlüssel
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="openai-api-key"
                    name="openai_api_key"
                    type="password"
                    placeholder="sk-..."
                    className="input pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.openai_api_key}
                    onChange={handleInputChange}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Dieser Schlüssel wird für alle KI-Funktionen in SalesSky.io benötigt. Sie können einen API-Schlüssel bei <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-secondary-600 dark:text-secondary-400">OpenAI</a> erstellen.
                </p>
              </div>
              
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="btn btn-primary flex items-center"
                >
                  <Save size={18} className="mr-2" />
                  {loading ? 'Wird gespeichert...' : 'API-Schlüssel speichern'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'integrations' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Integrationen</h2>
            <div className="space-y-6">
              {/* Billing statt Integrations-Abschnitt */}
              <div className="border rounded-lg p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Abrechnung</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Verwalten Sie Ihre Abonnements und Zahlungsmethoden.
                    </p>
                  </div>
                  <Link to="/settings/billing" className="btn btn-secondary dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    Zu Abrechnung
                  </Link>
                </div>
              </div>
              
              {/* Hinweis zur OpenAI Integration */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">KI-Assistenten</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Für Ihre E-Mail-Kampagnen stehen verschiedene KI-Assistenten zur Verfügung, die Sie beim Erstellen optimaler Inhalte unterstützen.
                  </p>
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    <p>• Alle Assistenten greifen auf unsere sichere API zu</p>
                    <p>• Sie können verschiedene Assistenten für verschiedene Kampagnen nutzen</p>
                    <p>• Die Assistenten werden regelmäßig aktualisiert und verbessert</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
