import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { EmailTemplate } from '../types';

interface EmailTemplateContextType {
  templates: EmailTemplate[];
  createTemplate: (template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>) => void;
  updateTemplate: (id: string, template: Partial<EmailTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  previewTemplate: (templateId: string, variables: Record<string, string>) => string;
  getTemplatesByCategory: (category: string) => EmailTemplate[];
  loading: boolean;
}

const EmailTemplateContext = createContext<EmailTemplateContextType | undefined>(undefined);


export function EmailTemplateProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching email templates:', error);
      } else {
        setTemplates(data || []);
      }
    } catch (error) {
      console.error('Error fetching email templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const createTemplate = async (templateData: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
      } else if (data) {
        setTemplates(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const updateTemplate = async (id: string, templateData: Partial<EmailTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update({ ...templateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
      } else if (data) {
        setTemplates(prev => prev.map(template => 
          template.id === id ? data : template
        ));
      }
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
      } else {
        setTemplates(prev => prev.filter(template => template.id !== id));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const duplicateTemplate = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    try {
      const duplicatedTemplateData = {
        ...template,
        name: `${template.name} (kopie)`,
        is_default: false
      };
      
      // Remove id, created_at, updated_at from the data
      delete duplicatedTemplateData.id;
      delete duplicatedTemplateData.created_at;
      delete duplicatedTemplateData.updated_at;

      const { data, error } = await supabase
        .from('email_templates')
        .insert([duplicatedTemplateData])
        .select()
        .single();

      if (error) {
        console.error('Error duplicating template:', error);
      } else if (data) {
        setTemplates(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const previewTemplate = (templateId: string, variables: Record<string, string>): string => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return '';

    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    return content;
  };

  const getTemplatesByCategory = (category: string) => {
    return templates.filter(template => template.category === category);
  };

  return (
    <EmailTemplateContext.Provider value={{
      templates,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      duplicateTemplate,
      previewTemplate,
      getTemplatesByCategory,
      loading
    }}>
      {children}
    </EmailTemplateContext.Provider>
  );
}

export function useEmailTemplate() {
  const context = useContext(EmailTemplateContext);
  if (context === undefined) {
    throw new Error('useEmailTemplate must be used within an EmailTemplateProvider');
  }
  return context;
}