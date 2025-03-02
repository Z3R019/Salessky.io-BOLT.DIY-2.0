import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn, user } = useAuth();
  
  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" />;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Bitte füllen Sie alle Felder aus.');
      }

      const { error } = await signIn(email, password);
      if (error) {
        // Translate common error messages
        if (error.message.includes('Invalid login credentials')) {
          setError('Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.');
        } else {
          setError(error.message);
        }
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Willkommen zurück</h2>
      <p className="text-gray-600 mb-8">
        Melden Sie sich an, um Ihre E-Mail-Kampagnen zu verwalten.
      </p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Passwort
            </label>
            <a href="#" className="text-sm text-secondary-600 hover:text-secondary-500">
              Passwort vergessen?
            </a>
          </div>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full btn btn-primary py-2.5"
          disabled={loading}
        >
          {loading ? 'Anmeldung...' : 'Anmelden'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Noch kein Konto?{' '}
          <a 
            href="https://www.salessky.io/demo" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-secondary-600 hover:text-secondary-500 font-medium"
          >
            Demo anfordern
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
