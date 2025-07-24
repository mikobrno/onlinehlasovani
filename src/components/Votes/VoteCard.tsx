import React from 'react';
import { Calendar, Users, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import type { Vote } from '../../types';
import { useVote } from '../../contexts/VoteContext';
import { useAuth } from '../../contexts/AuthContext';

interface VoteCardProps {
  vote: Vote;
  onClick: () => void;
  onShowProgress?: () => void;
}

export function VoteCard({ vote, onClick, onShowProgress }: VoteCardProps) {
  const { hasUserVoted, getVoteProgress } = useVote();
  const { user } = useAuth();
  
  const progress = getVoteProgress(vote.id);
  const userHasVoted = user ? hasUserVoted(vote.id, user.id) : false;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'draft': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'completed': return <Users className="h-5 w-5 text-blue-600" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktivní';
      case 'draft': return 'Koncept';
      case 'completed': return 'Ukončené';
      case 'cancelled': return 'Zrušeno';
      default: return status;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{vote.title}</h3>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(vote.status)}`}>
              {getStatusIcon(vote.status)}
              <span>{getStatusLabel(vote.status)}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">{vote.description}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {userHasVoted && vote.status === 'active' && (
            <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Hlasováno</span>
            </div>
          )}
          
          {onShowProgress && vote.status === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowProgress();
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Průběh
            </button>
          )}
        </div>
      </div>

      <div className="cursor-pointer" onClick={onClick}>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(vote.start_date)} - {formatDate(vote.end_date)}</span>
            </div>
            
            {progress && (
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{progress.voted_members}/{progress.total_members} hlasů ({Math.round(progress.participation_rate)}%)</span>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400">
            {vote.questions.length} {vote.questions.length === 1 ? 'otázka' : vote.questions.length < 5 ? 'otázky' : 'otázek'}
          </div>
        </div>

        {progress && vote.status === 'active' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Účast v hlasování</span>
              <span>{Math.round(progress.participation_rate)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.participation_rate}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}