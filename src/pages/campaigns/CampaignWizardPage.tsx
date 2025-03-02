import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Users, FileText, Calendar, Settings, Mail, Send, AtSign, AlertTriangle, Edit, ThumbsUp } from 'lucide-react';
import { assistantService, mockAssistants, Assistant } from '../../lib/openai';
import AssistantSelection from '../../components/campaigns/AssistantSelection';

type WizardStep = 'name' | 'account' | 'audience' | 'assistant' | 'template' | 'preview' | 'terms' | 'confirmation';

interface WizardStepInfo {
  id: WizardStep;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface EmailPreview {
  id: string;
  contactName: string;
  contactEmail: string;
  subject: string;
  content: string;
  approved: boolean;
}

const CampaignWizardPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('name');
  const [campaignName, setCampaignName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [templatePrompt, setTemplatePrompt] = useState('');
  const [emailPreviews, setEmailPreviews] = useState<EmailPreview[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch assistants when we reach that step
  useEffect(() => {
    if (currentStep === 'assistant' && assistants.length === 0) {
      fetchAssistants();
    }
  }, [currentStep]);

  const fetchAssistants = async () => {
    try {
      setLoadingAssistants(true);
      // In production, this would call the actual service
      // For now, simulate API call with a delay
      const result = await new Promise<Assistant[]>(resolve => {
        setTimeout(() => {
          resolve(mockAssistants);
        }, 1000);
      });
      setAssistants(result);
    } catch (error) {
      console.error('Error fetching assistants:', error);
    } finally {
      setLoadingAssistants(false);
    }
  };

  const steps: WizardStepInfo[] = [
    { 
      id: 'name', 
      title: 'Kampagnenname', 
      description: 'Geben Sie Ihrer Kampagne einen Namen.',
      icon: <Mail size={20} />
    },
    { 
      id: 'account', 
      title: 'E-Mail-Account auswählen', 
      description: 'Wählen Sie den E-Mail-Account für den Versand aus.',
      icon: <AtSign size={20} />
    },
    { 
      id: 'audience', 
      title: 'Zielgruppe auswählen', 
      description: 'Wählen Sie die Kontakte aus, die diese Kampagne erhalten sollen.',
      icon: <Users size={20} />
    },
    { 
      id: 'assistant', 
      title: 'KI-Assistent auswählen', 
      description: 'Wählen Sie den passenden KI-Assistenten für Ihre Kampagne.',
      icon: <Settings size={20} />
    },
    { 
      id: 'template', 
      title: 'KI E-Mail-Nachricht erstellen', 
      description: 'Beschreiben Sie den gewünschten E-Mail-Inhalt für den Assistenten.',
      icon: <FileText size={20} />
    },
    { 
      id: 'preview', 
      title: 'E-Mails überprüfen', 
      description: 'Überprüfen Sie die generierten E-Mails für jeden Kontakt.',
      icon: <Mail size={20} />
    },
    { 
      id: 'terms', 
      title: 'Nutzungsbedingungen', 
      description: 'Bestätigen Sie die Nutzungsbedingungen für den Versand.',
      icon: <AlertTriangle size={20} />
    },
    { 
      id: 'confirmation', 
      title: 'Bestätigung', 
      description: 'Ihre Kampagne wurde erfolgreich erstellt.',
      icon: <Check size={20} />
    }
  ];

  const handleNext = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
      
      // Wenn wir zum Preview-Schritt gehen, generieren wir die E-Mail-Vorschauen
      if (steps[currentIndex + 1].id === 'preview' && emailPreviews.length === 0) {
        generateEmailPreviews();
      }
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleSubmit = () => {
    // Hier würde die Kampagne erstellt und gespeichert werden
    setCurrentStep('confirmation');
  };

  const generateEmailPreviews = () => {
    setIsGenerating(true);
    
    // Beispielkontakte für die Vorschau (in Produktion würden diese aus der ausgewählten Zielgruppe kommen)
    const contacts = [
      { name: 'Max Mustermann', email: 'max.mustermann@beispiel.de', company: 'Musterfirma GmbH', position: 'Geschäftsführer' },
      { name: 'Maria Schmidt', email: 'maria.schmidt@beispiel.de', company: 'Schmidt & Partner', position: 'Marketing Managerin' },
      { name: 'Thomas Weber', email: 'thomas.weber@beispiel.de', company: 'Weber Logistik', position: 'Leiter Einkauf' }
    ];
    
    // In Produktion würde hier der tatsächliche Aufruf zum Generieren der E-Mails stattfinden
    setTimeout(async () => {
      try {
        // Simuliere den Aufruf des assistantService
        const generatedEmails = await assistantService.generateEmails(
          selectedAssistantId,
          templatePrompt,
          contacts
        );
        
        // Konvertiere die generierten E-Mails in das gewünschte Format für die Vorschau
        const previews: EmailPreview[] = generatedEmails.map((email, index) => ({
          id: index.toString(),
          contactName: contacts[index].name,
          contactEmail: contacts[index].email,
          subject: email.subject,
          content: email.content,
          approved: false
        }));
        
        setEmailPreviews(previews);
      } catch (error) {
        console.error('Error generating emails:', error);
      } finally {
        setIsGenerating(false);
      }
    }, 2000);
  };

  const handleApproveEmail = (id: string) => {
    setEmailPreviews(
      emailPreviews.map(preview => 
        preview.id === id ? { ...preview, approved: true } : preview
      )
    );
  };

  const handleRegenerateEmail = (id: string) => {
    // Simuliere die Neugenerierung einer E-Mail
    setIsGenerating(true);
    
    setTimeout(() => {
      setEmailPreviews(
        emailPreviews.map(preview => {
          if (preview.id === id) {
            return {
              ...preview,
              subject: 'Neu generierter Betreff: Entdecken Sie unsere maßgeschneiderten Lösungen',
              content: `Sehr geehrte(r) ${preview.contactName},

Nach einer erneuten Analyse Ihres Unternehmensprofils möchte ich Ihnen gerne unsere maßgeschneiderten Lösungen vorstellen, die perfekt auf Ihre Bedürfnisse zugeschnitten sind.

Unsere Plattform bietet eine Reihe von Funktionen, die speziell für Unternehmen in Ihrer Branche entwickelt wurden und Ihnen helfen können, Ihre Effizienz zu steigern und gleichzeitig Kosten zu senken.

Ich würde mich freuen, in einem kurzen Gespräch mehr über Ihre spezifischen Herausforderungen zu erfahren und Ihnen zu zeigen, wie wir Ihnen helfen können.

Wann würde es Ihnen passen, ein 15-minütiges Gespräch zu führen?

Mit freundlichen Grüßen,
Max Mustermann
Vertriebsleiter
Beispiel GmbH
+49 123 4567890`,
              approved: false
            };
          }
          return preview;
        })
      );
      setIsGenerating(false);
    }, 1500);
  };

  const allEmailsApproved = emailPreviews.length > 0 && emailPreviews.every(preview => preview.approved);

  // Beispieldaten für die Auswahl
  const accounts = [
    { id: '1', name: 'Max Mustermann', email: 'max.mustermann@beispiel.de', provider: 'Gmail' },
    { id: '2', name: 'Vertrieb', email: 'vertrieb@beispiel.de', provider: 'Outlook' },
    // Testaccount für einfaches Testen
    { id: 'test', name: 'Test Account', email: 'test@beispiel.de', provider: 'Test' },
  ];

  const audiences = [
    { id: '1', name: 'Marketing Kontakte', count: 156 },
    { id: '2', name: 'Vertriebskontakte', count: 89 },
    // Test-Zielgruppe für einfaches Testen
    { id: 'test', name: 'Test Kontakte (5)', count: 5 },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 'name':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-1">
                Kampagnenname
              </label>
              <input
                id="campaign-name"
                type="text"
                className="input"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="z.B. Q2 Verkaufskampagne"
              />
              <p className="mt-2 text-sm text-gray-500">
                Geben Sie Ihrer Kampagne einen aussagekräftigen Namen, um sie später leicht wiederzufinden.
              </p>
            </div>
          </div>
        );
      
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                E-Mail-Account auswählen
              </label>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div 
                    key={account.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedAccount === account.id 
                        ? 'border-secondary-500 bg-secondary-50' 
                        : 'border-gray-200 hover:border-secondary-300'
                    }`}
                    onClick={() => setSelectedAccount(account.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{account.name}</h3>
                        <p className="text-sm text-gray-500">{account.email} ({account.provider})</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedAccount === account.id 
                          ? 'border-secondary-500 bg-secondary-500' 
                          : 'border-gray-300'
                      }`}>
                        {selectedAccount === account.id && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link to="/accounts" className="text-secondary-600 hover:text-secondary-700 text-sm font-medium">
                  Neuen E-Mail-Account hinzufügen
                </Link>
              </div>
            </div>
          </div>
        );
      
      case 'audience':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Zielgruppe auswählen
              </label>
              <div className="space-y-3">
                {audiences.map((audience) => (
                  <div 
                    key={audience.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedAudience === audience.id 
                        ? 'border-secondary-500 bg-secondary-50' 
                        : 'border-gray-200 hover:border-secondary-300'
                    }`}
                    onClick={() => setSelectedAudience(audience.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{audience.name}</h3>
                        <p className="text-sm text-gray-500">{audience.count} Kontakte</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedAudience === audience.id 
                          ? 'border-secondary-500 bg-secondary-500' 
                          : 'border-gray-300'
                      }`}>
                        {selectedAudience === audience.id && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link to="/leads" className="text-secondary-600 hover:text-secondary-700 text-sm font-medium">
                  Neue Kontaktgruppe erstellen
                </Link>
              </div>
            </div>
          </div>
        );
      
      case 'assistant':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                KI-Assistent auswählen
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Wählen Sie den passenden KI-Assistenten für Ihre Kampagne. Jeder Assistent ist auf bestimmte Aufgabenbereiche spezialisiert.
              </p>
              
              <AssistantSelection
                assistants={assistants}
                selectedAssistantId={selectedAssistantId}
                onSelect={setSelectedAssistantId}
                isLoading={loadingAssistants}
              />
            </div>
          </div>
        );
      
      case 'template':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="template-prompt" className="block text-sm font-medium text-gray-700 mb-1">
                Beschreiben Sie Ihre E-Mail-Kampagne
              </label>
              <textarea
                id="template-prompt"
                rows={8}
                className="input"
                value={templatePrompt}
                onChange={(e) => setTemplatePrompt(e.target.value)}
                placeholder="Beschreiben Sie Ihre Branche, Ihr Produkt oder Ihre Dienstleistung, Ihre Zielgruppe und den Zweck der E-Mail. Je detaillierter Ihre Beschreibung, desto besser kann die KI personalisierte E-Mails erstellen."
              />
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Hilfreiche Informationen für die KI:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Branche Ihres Unternehmens</li>
                  <li>Produkt oder Dienstleistung, die Sie anbieten</li>
                  <li>Zielgruppe und deren Schmerzpunkte</li>
                  <li>Hauptvorteile Ihres Angebots</li>
                  <li>Gewünschte Handlungsaufforderung (Call-to-Action)</li>
                  <li>Ton der E-Mail (formell, freundlich, direkt, etc.)</li>
                </ul>
              </div>
            </div>
          </div>
        );
      
      case 'preview':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Überprüfen Sie die generierten E-Mails
              </h3>
              
              {isGenerating ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">E-Mails werden generiert...</p>
                </div>
              ) : (
                <div>
                  <p className="mb-4 text-sm text-gray-600">
                    Überprüfen Sie jede E-Mail und markieren Sie sie als "OK" oder lassen Sie sie neu generieren.
                    Alle E-Mails müssen genehmigt werden, bevor Sie fortfahren können.
                  </p>
                  
                  <div className="space-y-6">
                    {emailPreviews.map((preview) => (
                      <div key={preview.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{preview.contactName}</h3>
                            <p className="text-sm text-gray-500">{preview.contactEmail}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {preview.approved ? (
                              <span className="flex items-center text-green-600 text-sm">
                                <Check size={16} className="mr-1" />
                                Genehmigt
                              </span>
                            ) : (
                              <>
                                <button 
                                  className="btn btn-secondary text-sm py-1 flex items-center"
                                  onClick={() => handleRegenerateEmail(preview.id)}
                                  disabled={isGenerating}
                                >
                                  <Edit size={14} className="mr-1" />
                                  Neu generieren
                                </button>
                                <button 
                                  className="btn btn-primary text-sm py-1 flex items-center"
                                  onClick={() => handleApproveEmail(preview.id)}
                                >
                                  <ThumbsUp size={14} className="mr-1" />
                                  OK
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700">Betreff: </span>
                            <span className="text-sm">{preview.subject}</span>
                          </div>
                          <div className="bg-gray-50 p-4 rounded border whitespace-pre-wrap text-sm">
                            {preview.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'terms':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Wichtige Hinweise</h3>
                  <div className="mt-2 text-sm text-yellow-700 space-y-2">
                    <p>
                      Bitte beachten Sie die folgenden wichtigen Informationen, bevor Sie Ihre Kampagne starten:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Sie sind für den Inhalt der E-Mails verantwortlich und müssen sicherstellen, dass dieser den gesetzlichen Bestimmungen entspricht.</li>
                      <li>In vielen Ländern können unerwünschte Werbe-E-Mails (Cold-Mails) rechtliche Konsequenzen haben.</li>
                      <li>Wir übernehmen keine Haftung für den Inhalt der KI-generierten E-Mails oder für die Zustellung.</li>
                      <li>Wir übernehmen keine Haftung für rechtliche Konsequenzen, die sich aus dem Versand Ihrer E-Mails ergeben können.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-gray-700">
                  Ich bestätige, dass ich alle E-Mails manuell überprüft habe und die oben genannten Bedingungen akzeptiere
                </label>
              </div>
            </div>
          </div>
        );
      
      case 'confirmation':
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Kampagne erfolgreich erstellt</h3>
            <p className="mt-2 text-sm text-gray-500">
              Ihre Kampagne wurde erstellt und ist bereit zum Starten.
            </p>
            <div className="mt-6 space-x-3">
              <Link to="/campaigns" className="btn btn-secondary">
                Zu meinen Kampagnen
              </Link>
              <button className="btn btn-primary flex items-center">
                <Send size={18} className="mr-2" />
                Kampagne starten
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link to="/campaigns" className="text-gray-500 hover:text-gray-700 mr-4">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Neue Kampagne erstellen</h1>
          <p className="text-gray-600 mt-1">Folgen Sie den Schritten, um Ihre Kampagne zu konfigurieren</p>
        </div>
      </div>

      {/* Wizard */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Steps */}
        {currentStep !== 'confirmation' && (
          <div className="border-b">
            <div className="px-6 py-4 overflow-x-auto">
              <nav className="flex justify-between min-w-max">
                {steps.slice(0, -1).map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div 
                      className={`flex items-center justify-center h-8 w-8 rounded-full ${
                        steps.findIndex(s => s.id === currentStep) >= index 
                          ? 'bg-secondary-500 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span 
                      className={`ml-2 text-sm font-medium hidden sm:block ${
                        steps.findIndex(s => s.id === currentStep) >= index 
                          ? 'text-gray-900' 
                          : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                    {index < steps.length - 2 && (
                      <div className="hidden sm:block mx-4 w-8 h-0.5 bg-gray-200"></div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {currentStep !== 'confirmation' && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold">{steps.find(step => step.id === currentStep)?.title}</h2>
              <p className="text-gray-600 mt-1">{steps.find(step => step.id === currentStep)?.description}</p>
            </div>
          )}
          
          {renderStepContent()}
        </div>
        
        {/* Actions */}
        {currentStep !== 'confirmation' && (
          <div className="px-6 py-4 border-t flex justify-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrevious}
              disabled={currentStep === 'name'}
            >
              Zurück
            </button>
            
            {currentStep === 'terms' ? (
              <button
                type="button"
                className="btn btn-primary flex items-center"
                onClick={handleSubmit}
                disabled={!termsAccepted}
              >
                <Send size={18} className="mr-2" />
                Kampagne erstellen
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary flex items-center"
                onClick={handleNext}
                disabled={
                  (currentStep === 'name' && !campaignName) ||
                  (currentStep === 'account' && !selectedAccount) ||
                  (currentStep === 'audience' && !selectedAudience) ||
                  (currentStep === 'assistant' && !selectedAssistantId) ||
                  (currentStep === 'template' && !templatePrompt) ||
                  (currentStep === 'preview' && !allEmailsApproved)
                }
              >
                Weiter
                <ArrowRight size={18} className="ml-2" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignWizardPage;
