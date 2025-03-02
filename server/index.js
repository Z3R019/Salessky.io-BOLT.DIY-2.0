const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Email sending endpoint
app.post('/api/send-test-email', async (req, res) => {
  const { to, from, fromName, smtpConfig } = req.body;
  
  if (!to || !from || !smtpConfig) {
    return res.status(400).json({ 
      success: false, 
      message: 'Fehlende Parameter: to, from und smtpConfig sind erforderlich' 
    });
  }

  try {
    console.log('Creating transporter with config:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        // Passwort wird aus Sicherheitsgründen nicht geloggt
      }
    });

    // Erstellen eines nodemailer-Transporters mit der angegebenen SMTP-Konfiguration
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
      // Deaktivieren der TLS-Überprüfung für Tests (in Produktion entfernen)
      tls: {
        rejectUnauthorized: false
      }
    });

    // E-Mail-Optionen definieren
    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: to,
      subject: 'Test-E-Mail von SalesSky',
      text: `Dies ist eine Test-E-Mail, um die Konfiguration Ihres E-Mail-Accounts in SalesSky zu verifizieren.

Wenn Sie diese E-Mail erhalten haben, wurde Ihr E-Mail-Account erfolgreich konfiguriert und Sie können jetzt Kampagnen über SalesSky.io versenden.

Mit freundlichen Grüßen,
Ihr SalesSky-Team`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4f46e5;">Test-E-Mail von SalesSky</h2>
        <p>Dies ist eine Test-E-Mail, um die Konfiguration Ihres E-Mail-Accounts in SalesSky zu verifizieren.</p>
        <p>Wenn Sie diese E-Mail erhalten haben, wurde Ihr E-Mail-Account erfolgreich konfiguriert und Sie können jetzt Kampagnen über SalesSky.io versenden.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0; color: #666;">Mit freundlichen Grüßen,</p>
          <p style="margin: 0; font-weight: bold;">Ihr SalesSky-Team</p>
        </div>
      </div>
      `
    };

    console.log('Attempting to send email to:', to);

    // E-Mail senden
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);
    
    return res.status(200).json({ 
      success: true, 
      message: 'E-Mail erfolgreich gesendet',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: `Fehler beim Senden der E-Mail: ${error.message}`,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
