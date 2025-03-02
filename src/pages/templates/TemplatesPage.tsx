import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import TemplateEditor from '../../components/templates/TemplateEditor';
import TemplateList from '../../components/templates/TemplateList';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface Template {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const TemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedTemplates = data?.map(template => ({
        id: template.id,
        name: template.name,
        createdAt: format(new Date(template.created_at), 'dd.MM.yyyy'),
        updatedAt: format(new Date(template.updated_at || template.created_at), 'dd.MM.yyyy'),
      })) || [];

      setTemplates(formattedTemplates);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Fehler beim Laden der Vorlagen.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setShowEditor(true);
  };

  const handleSaveTemplate = async (template: {
    name: string;
    subject: string;
    content: string;
    variables: string[];
  }) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          user_id: user?.id,
          name: template.name,
          subject: template.subject,
          content: template.content,
          variables: template.variables
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newTemplate = {
        id: data.id,
        name: data.name,
        createdAt: format(new Date(data.created_at), 'dd.MM.yyyy'),
        updatedAt: format(new Date(data.created_at), 'dd.MM.yyyy'),
      };
      
      setTemplates([newTemplate, ...templates]);
      setShowEditor(false);
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Fehler beim Speichern der Vorlage.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = async (id: string) => {
    // This would typically open the editor with the template data
    // For now, we'll just log it
    console.log('Edit template:', id);
    
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      // Here you would open the editor with the template data
      // For now, we'll just alert with the template name
      alert(`Editing template: ${data.name}`);
    } catch (err) {
      console.error('Error fetching template for edit:', err);
      setError('Fehler beim Laden der Vorlage.');
    }
  };

  const handleDuplicateTemplate = async (id: string) => {
    try {
      setLoading(true);
      
      // First, get the template to duplicate
      const { data: templateToDuplicate, error: fetchError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Create a new template based on the existing one
      const { data: newTemplate, error: insertError } = await supabase
        .from('email_templates')
        .insert({
          user_id: user?.id,
          name: `${templateToDuplicate.name} (Kopie)`,
          subject: templateToDuplicate.subject,
          content: templateToDuplicate.content,
          variables: templateToDuplicate.variables
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const duplicatedTemplate = {
        id: newTemplate.id,
        name: newTemplate.name,
        createdAt: format(new Date(newTemplate.created_at), 'dd.MM.yyyy'),
        updatedAt: format(new Date(newTemplate.created_at), 'dd.MM.yyyy'),
      };

      setTemplates([duplicatedTemplate, ...templates]);
    } catch (err) {
      console.error('Error duplicating template:', err);
      setError('Fehler beim Duplizieren der Vorlage.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Möchten Sie diese Vorlage wirklich löschen?')) {
      try {
        setLoading(true);
        
        const { error } = await supabase
          .from('email_templates')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        setTemplates(templates.filter(template => template.id !== id));
      } catch (err) {
        console.error('Error deleting template:', err);
        setError('Fehler beim Löschen der Vorlage.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vorlagen</h1>
          <p className="text-gray-600 mt-1">Erstellen und verwalten Sie Ihre E-Mail-Vorlagen</p>
        </div>
        <button 
          className="btn btn-primary flex items-center"
          onClick={handleCreateTemplate}
        >
          <Plus size={18} className="mr-2" />
          Neue Vorlage
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {showEditor ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Neue Vorlage erstellen</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowEditor(false)}
            >
              Abbrechen
            </button>
          </div>
          <TemplateEditor onSave={handleSaveTemplate} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Meine Vorlagen</h2>
          {loading && templates.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Daten werden geladen...</p>
            </div>
          ) : (
            <TemplateList 
              templates={templates}
              onEdit={handleEditTemplate}
              onDuplicate={handleDuplicateTemplate}
              onDelete={handleDeleteTemplate}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;
