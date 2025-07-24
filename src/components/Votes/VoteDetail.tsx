import React, { useState } from 'react';
import { X, Calendar, Users, CheckCircle, Send, BarChart3, Eye } from 'lucide-react';
import type { Vote } from '../../types';
import { useVote } from '../../contexts/VoteContext';
import { useAuth } from '../../contexts/AuthContext';

interface VoteDetailProps {
  vote: Vote;
  onClose: () => void;
}

export function VoteDetail({ vote, onClose }: VoteDetailProps) {
  const { submitVote, hasUserVoted, getVoteResults, getVoteProgress, activateVote } = useVote();
  const { user } = useAuth();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [activating, setActivating] = useState(false);

  const userHasVoted = user ? hasUserVoted(vote.id, user.id) : false;
  const results = getVoteResults(vote.id);
  const progress = getVoteProgress(vote.id);
  const canVote = vote.status === 'active' && !userHasVoted;
  const canActivate = user?.role !== 'member' && vote.status === 'draft';

  const handleAnswerChange = (questionId: string, optionId: string, isMultiple: boolean) => {
    setSelectedAnswers(prev => {
      if (isMultiple) {
        const currentAnswers = prev[questionId] || [];
        const newAnswers = currentAnswers.includes(optionId)
          ? currentAnswers.filter(id => id !== optionId)
          : [...currentAnswers, optionId];
        return { ...prev, [questionId]: newAnswers };
      } else {
        return { ...prev, [questionId]: [optionId] };
      }
    });
  };

  const handleSubmitVote = () => {
    if (!user || !canVote) return;

    const answers = Object.entries(selectedAnswers).map(([questionId, optionIds]) => ({
      questionId,
      optionIds
    }));

    submitVote(vote.id, user.id, answers);
    onClose();
  };

  const handleActivateVote = async () => {
    setActivating(true);
    await activateVote(vote.id);
    setActivating(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">{vote.title}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vote.status)}`}>
              {vote.status === 'active' ? 'Aktivní' : 
               vote.status === 'draft' ? 'Koncept' :
               vote.status === 'completed' ? 'Ukončené' : 'Zrušeno'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Vote Info */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">{vote.description}</p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(vote.start_date)} - {formatDate(vote.end_date)}
                </span>
              </div>
              
              {progress && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {progress.voted_members}/{progress.total_members} hlasů ({Math.round(progress.participation_rate)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Vote Progress */}
          {progress && vote.status === 'active' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Účast v hlasování</span>
                <span>{Math.round(progress.participation_rate)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress.participation_rate}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 mb-6">
            {canActivate && (
              <button
                onClick={handleActivateVote}
                disabled={activating}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>{activating ? 'Aktivuji...' : 'Aktivovat hlasování'}</span>
              </button>
            )}
            
            {(vote.status === 'active' || vote.status === 'completed') && user?.role !== 'member' && (
              <button
                onClick={() => setShowResults(!showResults)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {showResults ? <Eye className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                <span>{showResults ? 'Skrýt výsledky' : 'Zobrazit výsledky'}</span>
              </button>
            )}
          </div>

          {/* Results */}
          {showResults && results && (
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Výsledky hlasování</h3>
              {results.map((result: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">{result.question}</h4>
                  <div className="space-y-2">
                    {result.options.map((option: any) => {
                      const percentage = result.totalVotes > 0 ? (option.votes / result.totalVotes) * 100 : 0;
                      return (
                        <div key={option.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{option.text}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
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
          )}

          {/* Voting Interface */}
          {canVote && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Můžete hlasovat</span>
              </div>

              {vote.questions.map((question) => (
                <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">{question.question}</h3>
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                          name={`question-${question.id}`}
                          value={option.id}
                          checked={selectedAnswers[question.id]?.includes(option.id) || false}
                          onChange={() => handleAnswerChange(question.id, option.id, question.type === 'multiple')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-gray-900">{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitVote}
                  disabled={Object.keys(selectedAnswers).length === 0}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Odeslat hlas</span>
                </button>
              </div>
            </div>
          )}

          {/* Already Voted */}
          {userHasVoted && (
            <div className="text-center py-6">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Váš hlas byl zaznamenán</h3>
              <p className="text-gray-600">Děkujeme za účast v hlasování.</p>
            </div>
          )}

          {/* Cannot Vote */}
          {!canVote && !userHasVoted && vote.status !== 'active' && (
            <div className="text-center py-6">
              <div className="text-gray-400 mb-3">
                {vote.status === 'draft' ? (
                  <span>Hlasování ještě nebylo aktivováno</span>
                ) : vote.status === 'completed' ? (
                  <span>Hlasování bylo ukončeno</span>
                ) : (
                  <span>Hlasování není dostupné</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}