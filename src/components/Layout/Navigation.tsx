import React from 'react';
import { 
  Vote, 
  Plus, 
  Users, 
  Mail, 
  BarChart3, 
  FileText, 
  ClipboardList,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { user } = useAuth();

  const tabs = [
    { id: 'votes', label: 'Hlasování', icon: Vote, roles: ['admin', 'chairman', 'member'] },
    { id: 'new-vote', label: 'Nové hlasování', icon: Plus, roles: ['admin', 'chairman'] },
    { id: 'members', label: 'Členové', icon: Users, roles: ['admin', 'chairman'] },
    { id: 'buildings', label: 'Budovy', icon: Building2, roles: ['admin'] },
    { id: 'email-templates', label: 'E-mailové šablony', icon: Mail, roles: ['admin', 'chairman'] },
    { id: 'results', label: 'Výsledky', icon: BarChart3, roles: ['admin', 'chairman'] },
    { id: 'audit', label: 'Audit', icon: ClipboardList, roles: ['admin'] },
    { id: 'documents', label: 'Dokumenty', icon: FileText, roles: ['admin', 'chairman', 'member'] }
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes(user?.role || ''));

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6">
        <div className="flex space-x-1 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${isActive
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}