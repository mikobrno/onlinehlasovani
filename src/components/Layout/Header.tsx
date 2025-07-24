import React from 'react';
import { LogOut, Building2, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBuilding } from '../../contexts/BuildingContext';

export function Header() {
  const { user, logout } = useAuth();
  const { selectedBuilding } = useBuilding();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrátor';
      case 'chairman': return 'Předseda';
      case 'member': return 'Člen';
      default: return role;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">OnlineSprava</h1>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              Hlasování
            </span>
          </div>
          
          {selectedBuilding && (
            <div className="hidden md:flex items-center space-x-2 ml-8">
              <Building2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedBuilding.name}</p>
                <p className="text-xs text-gray-500">{selectedBuilding.address}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                </div>
              </div>
              
              <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                DEV MODE
              </div>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Odhlásit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}