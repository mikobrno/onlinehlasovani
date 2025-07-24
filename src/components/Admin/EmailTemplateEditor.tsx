import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Plus, Trash2 } from 'lucide-react';
import { useEmailTemplate } from '../../contexts/EmailTemplateContext';
import type { EmailTemplate } from '../../types';

interface EmailTemplateEditorProps {
  template?: EmailTemplate | null;
  onClose: () => void;
}

export function EmailTemplateEditor({ template, onClose }: EmailTemplateEditorProps) {
  const { createTemplate, updateTemplate, previewTemplate } = useEmailTemplate();
  const isEditing = !!template;

  const [formData, setFormData] = useState({
    name: '',
    category: 'voting',
    subject: '',
    content: '',
    variables: [] as string[],
    is_default: false
  });

  const [newVariable, setNewVariable] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        category: template.category,
        subject: template.subject,
        content: template.content,
        variables: [...template.variables],
        is_default: template.is_default
      });
    }
  }, [template]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable.trim()]
      }));
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{{${variable}}}` + after;
      
      setFormData(prev => ({ ...prev, content: newText }));
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Název šablony je povinný';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Předmět je povinný';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Obsah šablony je povinný';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const templateData = {
      ...formData,
      name: formData.name.trim(),
      subject: formData.subject.trim(),
      content: formData.content.trim()
    };

    if (isEditing && template) {
      updateTemplate(template.id, templateData);
    } else {
      createTemplate(templateData);
    }

    onClose();
  };

  const handlePreview = () => {
    const mockVariables = {
      recipient_name: 'Jan Novák',
      vote_title: 'Schválení rozpočtu na rok 2024',
      vote_description: 'Hlasování o schválení rozpočtu společenství vlastníků na následující kalendářní rok.',
      vote_start_date: '15.01.2024',
      vote_end_date: '30.01.2024',
      voting_link: 'https://example.com/vote/abc123',
      building_name: 'Bytový dům Náměstí míru 12'
    };

    setShowPreview(true);
  };

  const getPreviewContent = () => {
    const mockVariables = {
      recipient_name: 'Jan Novák',
      vote_title: 'Schválení rozpočtu na rok 2024',
      vote_description: 'Hlasování o schválení rozpočtu společenství vlastníků na následující kalendářní rok.',
      vote_start_date: '15.01.2024',
      vote_end_date: '30.01.2024',
      voting_link: 'https://example.com/vote/abc123',
      building_name: 'Bytový dům Náměstí míru 12'
    };

    let content = formData.content;
    let subject = formData.subject;
    
    Object.entries(mockVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    return { content, subject };
  };

  const commonVariables = [
    'recipient_name',
    'vote_title', 
    'vote_description',
    'vote_start_date',
    'vote_end_date',
    'voting_link',
    'building_name'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Upravit šablonu' : 'Nová e-mailová šablona'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Název šablony *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Název šablony"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Kategorie *
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="voting">Hlasování</option>
                    <option value="reminder">Připomínky</option>
                    <option value="notification">Oznámení</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Předmět e-mailu *
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.subject ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Předmět e-mailu"
                />
                {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Obsah šablony *
                </label>
                <textarea
                  id="content"
                  rows={12}
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                    errors.content ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="HTML obsah e-mailu..."
                />
                {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  Můžete použít HTML tagy pro formátování. Proměnné vkládejte ve formátu {`{{variable_name}}`}.
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => handleInputChange('is_default', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                  Nastavit jako výchozí šablonu pro tuto kategorii
                </label>
              </div>
            </div>

            {/* Variables Panel */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Proměnné</h3>
                
                {/* Common Variables */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Běžné proměnné</h4>
                  <div className="space-y-1">
                    {commonVariables.map(variable => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="block w-full text-left px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Variables */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Vlastní proměnné</h4>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="název_proměnné"
                    />
                    <button
                      type="button"
                      onClick={addVariable}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    {formData.variables.map(variable => (
                      <div key={variable} className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded">
                        <button
                          type="button"
                          onClick={() => insertVariable(variable)}
                          className="flex-1 text-left text-sm text-blue-800 hover:text-blue-900"
                        >
                          {`{{${variable}}}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVariable(variable)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Náhled</span>
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{isEditing ? 'Uložit změny' : 'Vytvořit šablonu'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Náhled šablony</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Předmět:</p>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">{getPreviewContent().subject}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Obsah:</p>
                  <div 
                    className="prose max-w-none bg-gray-50 p-4 rounded border"
                    dangerouslySetInnerHTML={{ __html: getPreviewContent().content }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}