import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Mail,
  Search,
  Filter
} from 'lucide-react';
import { useEmailTemplate } from '../../contexts/EmailTemplateContext';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import type { EmailTemplate } from '../../types';

export function EmailTemplateManager() {
  const { 
    templates, 
    deleteTemplate, 
    duplicateTemplate, 
    previewTemplate,
    getTemplatesByCategory,
    loading 
  } = useEmailTemplate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewData, setPreviewData] = useState<{ template: EmailTemplate; content: string } | null>(null);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(templates.map(t => t.category))];

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    const mockVariables = {
      recipient_name: 'Jan Novák',
      vote_title: 'Schválení rozpočtu na rok 2024',
      vote_description: 'Hlasování o schválení rozpočtu společenství vlastníků na následující kalendářní rok.',
      vote_start_date: '15.01.2024',
      vote_end_date: '30.01.2024',
      voting_link: 'https://example.com/vote/abc123',
      building_name: 'Bytový dům Náměstí míru 12'
    };

    const content = previewTemplate(template.id, mockVariables);
    setPreviewData({ template, content });
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'voting': return 'Hlasování';
      case 'reminder': return 'Připomínky';
      case 'notification': return 'Oznámení';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'voting': return 'bg-blue-100 text-blue-800';
      case 'reminder': return 'bg-orange-100 text-orange-800';
      case 'notification': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">E-mailové šablony</h2>
          <p className="text-gray-600">Správa šablon pro e-mailové komunikace</p>
        </div>
        
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nová šablona</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Vyhledat šablonu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 h-4 w-4" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Všechny kategorie</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(template.category)}`}>
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
              </div>
              
              {template.is_default && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Výchozí
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Předmět:</p>
                <p className="text-sm text-gray-600 truncate">{template.subject}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Proměnné:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.variables.slice(0, 3).map((variable, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {`{{${variable}}}`}
                    </span>
                  ))}
                  {template.variables.length > 3 && (
                    <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{template.variables.length - 3}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Vytvořeno: {new Date(template.created_at).toLocaleDateString('cs-CZ')}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreview(template)}
                  className="text-blue-600 hover:text-blue-900 transition-colors"
                  title="Náhled"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="text-blue-600 hover:text-blue-900 transition-colors"
                  title="Upravit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => duplicateTemplate(template.id)}
                  className="text-green-600 hover:text-green-900 transition-colors"
                  title="Duplikovat"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-900 transition-colors"
                  title="Smazat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné šablony</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || categoryFilter !== 'all' 
              ? 'Žádné šablony neodpovídají vašim kritériím.' 
              : 'Zatím nebyly vytvořeny žádné e-mailové šablony.'}
          </p>
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <EmailTemplateEditor
          template={editingTemplate}
          onClose={() => {
            setShowEditor(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Náhled šablony</h3>
                <p className="text-gray-600">{previewData.template.name}</p>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Předmět:</p>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{previewData.template.subject}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Obsah:</p>
                <div 
                  className="prose max-w-none bg-gray-50 p-4 rounded border"
                  dangerouslySetInnerHTML={{ __html: previewData.content }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}