import { Tables } from '../lib/database.types';

// URL des E-Mail-Servers
const API_URL = 'http://localhost:3001';

// Typdefinition für die SMTP-Konfiguration
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Typdefinition für die E-Mail-Anfrage
interface EmailRequest {
  to: string;
  from: string;
  fromName: string;
  smtpConfig: SmtpConfig;
}

// Typdefinition für die E-Mail-Antwort
interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
  code?: string;
}

// Funktion zum Konvertieren des Sicherheitstyps in das secure-Flag
const isSecureConnection = (securityType: string): boolean => {
  return securityType === 'SSL';
};

// Funktion zum Konvertieren des Ports in eine Zahl
const parsePort = (portStr: string | null): number => {
  if (!portStr) return 0;
  const port = parseInt(portStr);
  return isNaN(port) ? 0 : port;
};

/**
 * Sendet eine Test-E-Mail über die API
 * @param account E-Mail-Account-Konfiguration
 * @param testEmailAddress Ziel-E-Mail-Adresse für den Test
 * @returns Promise mit dem Ergebnis des E-Mail-Versands
 */
export const sendTestEmail = async (
  account: Tables<'email_accounts'>, 
  testEmailAddress: string
): Promise<EmailResponse> => {
  try {
    // SMTP-Konfiguration aus dem Account extrahieren
    const smtpConfig: SmtpConfig = {
      host: account.smtp_host || '',
      port: parsePort(account.smtp_port?.toString() || ''),
      secure: isSecureConnection(account.smtp_security || ''),
      auth: {
        user: account.smtp_username || '',
        pass: account.smtp_password || '',
      },
    };

    // Validierung der Konfiguration
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      throw new Error('Unvollständige SMTP-Konfiguration');
    }

    // Anfrage für die Test-E-Mail erstellen
    const request: EmailRequest = {
      to: testEmailAddress,
      from: account.email || '',
      fromName: account.name || '',
      smtpConfig,
    };

    // Test-E-Mail senden
    console.log('Sende Anfrage an E-Mail-API:', `${API_URL}/api/send-test-email`);
    
    const response = await fetch(`${API_URL}/api/send-test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    // Antwort verarbeiten
    const data: EmailResponse = await response.json();
    
    if (!response.ok) {
      console.error('E-Mail-API hat einen Fehler zurückgegeben:', data);
      return {
        success: false,
        message: data.message || 'E-Mail konnte nicht gesendet werden',
        error: data.error || 'Unbekannter Fehler',
        code: data.code || 'API_ERROR',
      };
    }

    // Erfolgreiche Antwort zurückgeben
    console.log('E-Mail erfolgreich gesendet:', data);
    return data;
  } catch (error) {
    // Fehlerbehandlung
    console.error('Fehler beim Senden der Test-E-Mail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    
    return {
      success: false,
      message: `Fehler beim Senden der Test-E-Mail: ${errorMessage}`,
      error: errorMessage,
    };
  }
};
