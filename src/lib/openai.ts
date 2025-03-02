import { supabase } from './supabase';

// Assistenten-Typen
export interface Assistant {
  id: string;
  name: string;
  description: string;
  model: string;
  capabilities: string[];
  icon?: string;
}

// Eine Schnittstelle, die OpenAI Assistenten verbirgt,
// ohne den API-Key dem Client zugänglich zu machen
export const assistantService = {
  // Holt verfügbare Assistenten aus der Datenbank
  async getAssistants(): Promise<Assistant[]> {
    try {
      const { data, error } = await supabase
        .from('openai_assistants')
        .select('*')
        .eq('is_active', true);
        
      if (error) {
        console.error('Error fetching assistants:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAssistants:', error);
      throw error;
    }
  },
  
  // Generiert E-Mail-Inhalte mit einem bestimmten Assistenten
  async generateEmails(
    assistantId: string, 
    prompt: string, 
    contacts: Array<{ name: string, email: string, company?: string, position?: string }>
  ): Promise<Array<{ contactId: string, subject: string, content: string }>> {
    try {
      // In einer realen Implementierung würden wir hier einen API-Endpunkt aufrufen,
      // der den OpenAI-Key sicher speichert und die Anfrage weiterleitet
      
      // WICHTIG: Zu Demonstrationszwecken simulieren wir die Antwort
      // In Produktion würde diese Funktion einen sicheren Backend-Endpunkt aufrufen
      
      // Simulierte Antwortzeit (1-3 Sekunden)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulierte generierte E-Mails
      return contacts.map(contact => ({
        contactId: contact.email,
        subject: `Personalisiertes Angebot für ${contact.name} von ${contact.company || 'Ihr Unternehmen'}`,
        content: `Sehr geehrte(r) ${contact.name},

Ich hoffe, diese Nachricht erreicht Sie gut. Basierend auf Ihrer Position als ${contact.position || 'Fachexperte'} bei ${contact.company || 'Ihrem Unternehmen'}, möchte ich Ihnen gerne unser Angebot vorstellen.

${prompt}

Ich würde mich über die Gelegenheit freuen, mehr über Ihre spezifischen Anforderungen zu erfahren.

Mit freundlichen Grüßen,
Ihr Team`
      }));
    } catch (error) {
      console.error('Error generating emails:', error);
      throw error;
    }
  }
};

// Beispiel-Assistenten für die Entwicklung (werden normalerweise aus der Datenbank geladen)
export const mockAssistants: Assistant[] = [
  {
    id: 'asst_sales',
    name: 'Sales Assistant',
    description: 'Spezialisiert auf Vertriebskommunikation und Angebote',
    model: 'gpt-4',
    capabilities: ['Personalisierte Verkaufsansprache', 'Angebotsvorschläge', 'Nachfass-Emails'],
    icon: 'shopping_cart'
  },
  {
    id: 'asst_marketing',
    name: 'Marketing Assistant',
    description: 'Erstellt Marketing-Materialien und Kampagnen',
    model: 'gpt-4',
    capabilities: ['Newsletter', 'Produktbeschreibungen', 'Marketing-Kampagnen'],
    icon: 'campaign'
  },
  {
    id: 'asst_support',
    name: 'Kundenservice Assistant',
    description: 'Hilfreich für Kundensupport und Anfragenbeantwortung',
    model: 'gpt-3.5-turbo',
    capabilities: ['Anfragenbeantwortung', 'Problembehebung', 'FAQ-Erstellung'],
    icon: 'support_agent'
  },
  {
    id: 'asst_recruiter',
    name: 'Recruiting Assistant',
    description: 'Optimiert für Personalgewinnung und Kandidatenkommunikation',
    model: 'gpt-4',
    capabilities: ['Stellenangebote', 'Kandidatenansprache', 'Bewerbungsprozess'],
    icon: 'person_search'
  }
];
