import React, { useState } from 'react';
import { Plus, Trash2, Save, Calendar, Users } from 'lucide-react';
import { useVote } from '../../contexts/VoteContext';
import { useAuth } from '../../contexts/AuthContext';
import { useBuilding } from '../../contexts/BuildingContext';
import type { Vote, VoteQuestion } from '../../types';

export function CreateVote() {
  const { createVote } = useVote();
  const { user } = useAuth();
  const { selectedBuilding } = useBuilding();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    observers: ''
  });
  
  const [questions, setQuestions] = useState<VoteQuestion[]>([
    {
      id: '1',
      question: '',
      type: 'single' as const,
      options: [
        { id: '1', text: '' },
        { id: '2', text: '' }
      ]
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addQuestion = () => {
    const newQuestion: VoteQuestion = {
      id: Date.now().toString(),
      question: '',
      type: 'single',
      options: [
        { id: Date.now() + 1 + '', text: '' },
        { id: Date.now() + 2 + '', text: '' }
      ]
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    }
  };

  const updateQuestion = (questionId: string, field: string, value: any) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: [...q.options, { id: Date.now().toString(), text: '' }] 
          }
        : q
    ));
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.filter(o => o.id !== optionId) 
          }
        : q
    ));
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map(o => o.id === optionId ? { ...o, text } : o) 
          }
        : q
    ));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Název hlasování je povinný';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Popis je povinný';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Datum začátku je povinné';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Datum konce je povinné';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'Datum konce musí být později než datum začátku';
    }

    questions.forEach((question, qIndex) => {
      if (!question.question.trim()) {
        newErrors[`question-${question.id}`] = `Otázka ${qIndex + 1} je povinná`;
      }

      const validOptions = question.options.filter(o => o.text.trim());
      if (validOptions.length < 2) {
        newErrors[`question-${question.id}-options`] = `Otázka ${qIndex + 1} musí mít alespoň 2 možnosti`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user || !selectedBuilding) return;

    const observersArray = formData.observers
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    const cleanedQuestions = questions.map(q => ({
      ...q,
      options: q.options.filter(o => o.text.trim())
    })).filter(q => q.question.trim() && q.options.length >= 2);

    const newVote: Omit<Vote, 'id' | 'created_at' | 'updated_at'> = {
      building_id: selectedBuilding.id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: 'draft',
      start_date: new Date(formData.startDate).toISOString(),
      end_date: new Date(formData.endDate).toISOString(),
      questions: cleanedQuestions,
      observers: observersArray,
      created_by: user.id
    };

    createVote(newVote);

    // Reset form
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      observers: ''
    });
    setQuestions([
      {
        id: '1',
        question: '',
        type: 'single',
        options: [
          { id: '1', text: '' },
          { id: '2', text: '' }
        ]
      }
    ]);
    setErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Plus className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Vytvořit nové hlasování</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Název hlasování *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Název hlasování"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Popis *
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Detailní popis hlasování"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Datum začátku *
              </label>
              <input
                type="datetime-local"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Datum konce *
              </label>
              <input
                type="datetime-local"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="observers" className="block text-sm font-medium text-gray-700 mb-1">
                Pozorovatelé (e-maily oddělené čárkami)
              </label>
              <input
                type="text"
                id="observers"
                value={formData.observers}
                onChange={(e) => handleInputChange('observers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email1@example.com, email2@example.com"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Otázky</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Přidat otázku</span>
              </button>
            </div>

            {questions.map((question, qIndex) => (
              <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Otázka {qIndex + 1}</h4>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[`question-${question.id}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Text otázky"
                    />
                    {errors[`question-${question.id}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`question-${question.id}`]}</p>
                    )}
                  </div>

                  <div>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="single">Jedna odpověď</option>
                      <option value="multiple">Více odpovědí</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Možnosti</label>
                      <button
                        type="button"
                        onClick={() => addOption(question.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        + Přidat možnost
                      </button>
                    </div>
                    
                    {question.options.map((option, oIndex) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 w-8">{oIndex + 1}.</span>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Možnost ${oIndex + 1}`}
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, option.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {errors[`question-${question.id}-options`] && (
                      <p className="text-sm text-red-600">{errors[`question-${question.id}-options`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Vytvořit hlasování</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}