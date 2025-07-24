import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Header } from './components/Layout/Header';
import { Navigation } from './components/Layout/Navigation';
import { VotesList } from './components/Votes/VotesList';
import { CreateVote } from './components/Admin/CreateVote';
import { MembersView } from './components/Admin/MembersView';
import { EmailTemplateManager } from './components/Admin/EmailTemplateManager';
import { VotingProgressView } from './components/Admin/VotingProgressView';
import { EmailVotingInterface } from './components/Voting/EmailVotingInterface';

function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('votes');
  const [selectedVoteForProgress, setSelectedVoteForProgress] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání aplikace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Přihlašování...</p>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'votes':
        return <VotesList onShowProgress={setSelectedVoteForProgress} />;
      case 'new-vote':
        return <CreateVote />;
      case 'members':
        return <MembersView />;
      case 'buildings':
        return <MembersView />; // BuildingManagement is integrated into MembersView
      case 'email-templates':
        return <EmailTemplateManager />;
      case 'results':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Výsledky</h3>
            <p className="text-gray-600">Zobrazení výsledků bude implementováno v další verzi.</p>
          </div>
        );
      case 'audit':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Audit</h3>
            <p className="text-gray-600">Auditní protokoly budou implementovány v další verzi.</p>
          </div>
        );
      case 'documents':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Dokumenty</h3>
            <p className="text-gray-600">Správa dokumentů bude implementována v další verzi.</p>
          </div>
        );
      default:
        return <VotesList />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/vote/:token" element={<EmailVotingInterface />} />
        <Route path="/*" element={
          <div className="min-h-screen bg-gray-50">
            <Header />
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {renderActiveTab()}
            </main>

            {/* Voting Progress Modal */}
            {selectedVoteForProgress && (
              <VotingProgressView
                vote={selectedVoteForProgress}
                onClose={() => setSelectedVoteForProgress(null)}
              />
            )}
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;