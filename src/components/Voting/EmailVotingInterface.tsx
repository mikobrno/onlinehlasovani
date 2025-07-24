import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, Building2, User, Calendar } from 'lucide-react';
import { EmailVotingService, type EmailVotingData, type VoteAnswer } from '../../services/emailVotingService';

export function EmailVotingInterface() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [votingData, setVotingData] = useState<EmailVotingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!token) {
      setError('Invalid voting link');
      setLoading(false);
      return;
    }

    loadVotingData();
  }, [token]);

  const loadVotingData = async () => {
    try {
      setLoading(true);
      const data = await EmailVotingService.getVotingData(token!);
      setVotingData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load voting data');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmitVote = async () => {
    if (!votingData || !token) return;

    try {
      setSubmitting(true);
      
      const answers: VoteAnswer[] = Object.entries(selectedAnswers).map(([questionId, optionIds]) => ({
        questionId,
        optionIds
      }));

      await EmailVotingService.submitVote(token, answers);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání hlasování...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chyba</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Zpět na hlavní stránku
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hlas byl zaznamenán</h2>
          <p className="text-gray-600 mb-4">
            Děkujeme za účast v hlasování. Váš hlas byl úspěšně zaznamenán.
          </p>
          <div className="text-sm text-gray-500">
            <p><strong>Člen:</strong> {votingData?.member.first_name} {votingData?.member.last_name}</p>
            <p><strong>Hlasování:</strong> {votingData?.vote.title}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!votingData) {
    return null;
  }

  if (votingData.hasVoted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Již jste hlasoval/a</h2>
          <p className="text-gray-600 mb-4">
            V tomto hlasování jste již odevzdal/a svůj hlas.
          </p>
          <div className="text-sm text-gray-500">
            <p><strong>Hlasování:</strong> {votingData.vote.title}</p>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = Object.keys(selectedAnswers).length === votingData.vote.questions.length &&
                   Object.values(selectedAnswers).every(answers => answers.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">OnlineSprava | Hlasování</h1>
              <p className="text-gray-600">{votingData.building.name}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {votingData.member.first_name} {votingData.member.last_name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                Do: {formatDate(votingData.vote.end_date)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Aktivní hlasování</span>
            </div>
          </div>
        </div>

        {/* Vote Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{votingData.vote.title}</h2>
          <p className="text-gray-700 mb-6">{votingData.vote.description}</p>

          {/* Questions */}
          <div className="space-y-8">
            {votingData.vote.questions.map((question: any, index: number) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {index + 1}. {question.question}
                </h3>
                
                <div className="space-y-3">
                  {question.options.map((option: any) => (
                    <label
                      key={option.id}
                      className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <input
                        type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={selectedAnswers[question.id]?.includes(option.id) || false}
                        onChange={() => handleAnswerChange(question.id, option.id, question.type === 'multiple')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-900 flex-1">{option.text}</span>
                    </label>
                  ))}
                </div>
                
                {question.type === 'multiple' && (
                  <p className="text-sm text-gray-500 mt-2">
                    Můžete vybrat více možností
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p>Zkontrolujte své odpovědi před odesláním.</p>
              <p>Po odeslání již nebude možné hlas změnit.</p>
            </div>
            
            <button
              onClick={handleSubmitVote}
              disabled={!canSubmit || submitting}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle className="h-5 w-5" />
              <span>{submitting ? 'Odesílání...' : 'Odeslat hlas'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}