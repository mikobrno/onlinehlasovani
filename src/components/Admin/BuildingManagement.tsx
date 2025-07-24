import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Building2,
  MapPin,
  Users,
  Calendar
} from 'lucide-react';
import { useBuilding } from '../../contexts/BuildingContext';
import { AddBuildingModal } from './AddBuildingModal';
import { BuildingCSVImportModal } from './BuildingCSVImportModal';

interface BuildingManagementProps {
  onBack: () => void;
}

export function BuildingManagement({ onBack }: BuildingManagementProps) {
  const { buildings, deleteBuilding, loading } = useBuilding();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);

  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = 
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && building.is_active) ||
      (statusFilter === 'inactive' && !building.is_active);
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Název', 'Adresa', 'Popis', 'Aktivní'];
    const csvContent = [
      headers.join(','),
      ...filteredBuildings.map(building => [
        building.name,
        building.address,
        building.description || '',
        building.is_active ? 'Ano' : 'Ne'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budovy-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Zpět na členy</span>
          </button>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Správa budov</h2>
            <p className="text-gray-600">{buildings.length} budov celkem</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import CSV</span>
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Přidat budovu</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Vyhledat budovu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Všechny stavy</option>
              <option value="active">Aktivní</option>
              <option value="inactive">Neaktivní</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuildings.map((building) => (
          <div key={building.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{building.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    building.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {building.is_active ? 'Aktivní' : 'Neaktivní'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingBuilding(building)}
                  className="text-blue-600 hover:text-blue-900 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteBuilding(building.id)}
                  className="text-red-600 hover:text-red-900 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">{building.address}</p>
              </div>
              
              {building.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{building.description}</p>
              )}
              
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>Vytvořeno: {formatDate(building.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBuildings.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné budovy</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Žádné budovy neodpovídají vašim kritériím.' 
              : 'Zatím nebyly přidány žádné budovy.'}
          </p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddBuildingModal
          building={editingBuilding}
          onClose={() => {
            setShowAddModal(false);
            setEditingBuilding(null);
          }}
        />
      )}

      {editingBuilding && (
        <AddBuildingModal
          building={editingBuilding}
          onClose={() => setEditingBuilding(null)}
        />
      )}

      {showImportModal && (
        <BuildingCSVImportModal
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}