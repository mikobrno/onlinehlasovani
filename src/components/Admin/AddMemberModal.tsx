import React, { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { useMember } from '../../contexts/MemberContext';
import { useBuilding } from '../../contexts/BuildingContext';
import type { Member } from '../../types';

interface AddMemberModalProps {
  member?: Member | null;
  onClose: () => void;
}

export function AddMemberModal({ member, onClose }: AddMemberModalProps) {
  const { addMember, updateMember } = useMember();
  const { selectedBuilding } = useBuilding();
  const isEditing = !!member;

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    unit_number: '',
    ownership_share: '',
    role: 'member' as const,
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member) {
      setFormData({
        email: member.email,
        first_name: member.first_name,
        last_name: member.last_name,
        phone: member.phone || '',
        unit_number: member.unit_number,
        ownership_share: member.ownership_share.toString(),
        role: member.role,
        is_active: member.is_active
      });
    }
  }, [member]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail je povinný';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Neplatný formát e-mailu';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Jméno je povinné';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Příjmení je povinné';
    }

    if (!formData.unit_number.trim()) {
      newErrors.unit_number = 'Číslo jednotky je povinné';
    }

    if (!formData.ownership_share.trim()) {
      newErrors.ownership_share = 'Vlastnický podíl je povinný';
    } else {
      const share = parseFloat(formData.ownership_share);
      if (isNaN(share) || share < 0 || share > 100) {
        newErrors.ownership_share = 'Vlastnický podíl musí být číslo mezi 0 a 100';
      }
    }

    if (formData.phone && !/^\+?[0-9\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Neplatný formát telefonu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedBuilding) return;

    const memberData = {
      ...formData,
      building_id: selectedBuilding.id,
      ownership_share: parseFloat(formData.ownership_share),
      phone: formData.phone || undefined
    };

    if (isEditing && member) {
      updateMember(member.id, memberData);
    } else {
      addMember(memberData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Upravit člena' : 'Přidat nového člena'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                Jméno *
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.first_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Jan"
              />
              {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Příjmení *
              </label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.last_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Novák"
              />
              {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="jan.novak@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+420 123 456 789"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700 mb-1">
                Číslo jednotky *
              </label>
              <input
                type="text"
                id="unit_number"
                value={formData.unit_number}
                onChange={(e) => handleInputChange('unit_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.unit_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12"
              />
              {errors.unit_number && <p className="mt-1 text-sm text-red-600">{errors.unit_number}</p>}
            </div>

            <div>
              <label htmlFor="ownership_share" className="block text-sm font-medium text-gray-700 mb-1">
                Vlastnický podíl (%) *
              </label>
              <input
                type="number"
                id="ownership_share"
                step="0.1"
                min="0"
                max="100"
                value={formData.ownership_share}
                onChange={(e) => handleInputChange('ownership_share', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.ownership_share ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12.5"
              />
              {errors.ownership_share && <p className="mt-1 text-sm text-red-600">{errors.ownership_share}</p>}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="member">Člen</option>
                <option value="chairman">Předseda</option>
                <option value="admin">Administrátor</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Aktivní člen
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Uložit změny' : 'Přidat člena'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}