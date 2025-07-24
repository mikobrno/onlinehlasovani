import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  CheckCircle, 
  Clock, 
  Send, 
  RefreshCw,
  BarChart3,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { useVote } from '../../contexts/VoteContext';
import { useMember } from '../../contexts/MemberContext';
import { EmailVotingService } from '../../services/emailVotingService';
import type { Vote, Member } from '../../types';

interface VotingProgressViewProps {
  vote: Vote;
  onClose: () => void;
}

export function VotingProgressView({ vote, onClose }: VotingProgressViewProps) {
  const { getVoteProgress, getVoteResults } = useVote();
  const { members } = useMember();
  const [loading, setLoading] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const progress = getVoteProgress(vote.id);
  const results = getVoteResults(vote.id);

  const handleSendEmail = async (memberId: string) => {
    try {
      setLoading(true);
      await EmailVotingService.sendVotingEmail(vote.id, memberId);
      // Refresh data after sending
      setTimeout(() => setLoading(false), 1000);
    } catch (error) {
      console.error('Failed to send email:', error);
      setLoading(false);
    }
  };

  const handleSendBulkEmails = async () => {
    try {
      setSendingEmails(true);
      const memberIds = selectedMembers.length > 0 ? selectedMembers : 
                       progress?.member_details.pending.map(m => m.id);
      
      await EmailVotingService.distributeVotingEmails(vote.id, memberIds);
      setSelectedMembers([]);
      // Refresh data after sending
      setTimeout(() => setSendingEmails(false), 2000);
    } catch (error) {
      console.error('Failed to send bulk emails:', error);
      setSendingEmails(false);
    }
  };

  const handleMemberSelect = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const exportResults = () => {
    if (!results) return;

    const csvContent = [
      ['Otázka', 'Možnost', 'Počet hlasů', 'Procenta'],
      ...results.flatMap((result: any) => 
        result.options.map((option: any) => [
          result.question,
          option.text,
          option.votes,
          result.totalVotes > 0 ? `${Math.round((option.votes / result.totalVotes) * 100)}%` : '0%'
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vysledky-${vote.title.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!progress) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{vote.title}</h2>
            <p className="text-gray-600">Průběh hlasování v reálném čase</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowResults(!showResults)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {showResults ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showResults ? 'Skrýt výsledky' : 'Zobrazit výsledky'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Celkem členů</p>
                  <p className="text-2xl font-semibold text-blue-900">{progress.total_members}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Hlasovalo</p>
                  <p className="text-2xl font-semibold text-green-900">{progress.voted_members}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-600">Nehlasovalo</p>
                  <p className="text-2xl font-semibold text-orange-900">{progress.pending_members}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Účast</p>
                  <p className="text-2xl font-semibold text-purple-900">
                    {Math.round(progress.participation_rate)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Průběh hlasování</span>
              <span>{Math.round(progress.participation_rate)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.participation_rate}%` }}
              />
            </div>
          </div>

          {/* Results Section */}
          {showResults && results && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Průběžné výsledky</h3>
                <button
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {results.map((result: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{result.question}</h4>
                    <div className="space-y-2">
                      {result.options.map((option: any) => {
                        const percentage = result.totalVotes > 0 ? (option.votes / result.totalVotes) * 100 : 0;
                        return (
                          <div key={option.id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 flex-1">{option.text}</span>
                            <div className="flex items-center space-x-3 ml-4">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-16 text-right">
                                {option.votes} ({Math.round(percentage)}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {selectedMembers.length > 0 
                  ? `Vybráno ${selectedMembers.length} členů`
                  : `${progress.pending_members} členů nehlasovalo`
                }
              </span>
              {selectedMembers.length > 0 && (
                <button
                  onClick={() => setSelectedMembers([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Zrušit výběr
                </button>
              )}
            </div>
            
            <button
              onClick={handleSendBulkEmails}
              disabled={sendingEmails || progress.pending_members === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>
                {sendingEmails ? 'Odesílání...' : 
                 selectedMembers.length > 0 ? 'Poslat vybraným' : 'Poslat připomínky'}
              </span>
            </button>
          </div>

          {/* Members Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voted Members */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Hlasovali ({progress.voted_members})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {progress.member_details.voted.map((member: Member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                    <div>
                      <p className="font-medium text-green-900">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-sm text-green-700">{member.email}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Members */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 text-orange-600 mr-2" />
                Nehlasovali ({progress.pending_members})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {progress.member_details.pending.map((member: Member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleMemberSelect(member.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <p className="font-medium text-orange-900">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-orange-700">{member.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendEmail(member.id)}
                      disabled={loading}
                      className="flex items-center space-x-1 px-2 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="h-3 w-3" />
                      <span>Poslat</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}