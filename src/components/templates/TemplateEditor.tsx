import React, { useState } from 'react';
import { Save } from 'lucide-react';

interface TemplateEditorProps {
  onSave: (template: {
    name: string;
    subject: string;
    content: string;
    variables: string[];
  }) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateWithAI = () => {
    setIsGenerating(true);
    // Simuliere AI-Generierung
    setTimeout(() => {
      setSubject('Exklusive Einladung: Entdecken Sie unsere neuen Lösungen');
      setContent(`Sehr geehrte(r) {{name}},

Ich hoffe, diese E-Mail erreicht Sie gut. Mein Name ist {{sender_name}} von {{company_name}}, und ich möchte Ihnen heute eine exklusive Gelegenheit vorstellen.

Wir haben bemerkt, dass {{recipient_company}} im Bereich {{industry}} tätig ist, und ich glaube, dass unsere Lösungen einen erheblichen Mehrwert für Ihr Unternehmen bieten könnten.

Unsere Kunden berichten von einer durchschnittlichen Effizienzsteigerung von 35% nach der Implementierung unserer Plattform.

Hätten Sie Interesse an einem kurzen 15-minütigen Gespräch, um zu besprechen, wie wir Ihnen helfen können?

Mit freundlichen Grüßen,
{{sender_name}}
{{sender_position}}
{{company_name}}
{{phone_number}}
`);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    // Extrahiere Variablen aus dem Content (alles zwischen {{ und }})
    const variableRegex = /{{(.*?)}}/g;
    const matches = content.match(variableRegex) || [];
    const variables = matches.map(match => match.replace(/{{|}}/g, ''));

    onSave({
      name,
      subject,
      content,
      variables: [...new Set(variables)], // Entferne Duplikate
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
          Vorlagenname
        </label>
        <input
          id="template-name"
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Verkaufsvorlage"
        />
      </div>

      <div>
        <label htmlFor="template-subject" className="block text-sm font-medium text-gray-700 mb-1">
          Betreff
        </label>
        <input
          id="template-subject"
          type="text"
          className="input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="E-Mail-Betreff"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="template-content" className="block text-sm font-medium text-gray-700">
            Inhalt
          </label>
          <button
            type="button"
            className="text-sm text-secondary-600 hover:text-secondary-500"
            onClick={handleGenerateWithAI}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generiere...' : 'Mit KI generieren'}
          </button>
        </div>
        <textarea
          id="template-content"
          rows={12}
          className="input font-mono"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Schreiben Sie hier Ihre E-Mail-Vorlage. Verwenden Sie {{variable}} für personalisierte Felder."
        />
        <p className="mt-2 text-sm text-gray-500">
          Verwenden Sie {{variable}} für personalisierte Felder, z.B. {{name}} oder {{company}}.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-primary flex items-center"
          onClick={handleSave}
          disabled={!name || !subject || !content}
        >
          <Save size={18} className="mr-2" />
          Vorlage speichern
        </button>
      </div>
    </div>
  );
};

export default TemplateEditor;
