import React, { useState } from 'react';
import { Search, Filter, Calendar, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useVote } from '../../contexts/VoteContext';
import { useAuth } from '../../contexts/AuthContext';
import { VoteCard } from './VoteCard';
import { VoteDetail } from './VoteDetail';
import type { Vote } from '../../types';

interface VotesListProps {
  onShowProgress?: (vote: Vote) => void;
}

export function VotesList({ onShowProgress }: VotesListProps) {
  const { votes, loading } = useVote();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);

  const filteredVotes = votes.filter(vote => {
    const matchesSearch = vote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vote.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusCount = (status: string) => {
    return votes.filter(vote => vote.status === status).length;
  };

  const statusStats = [
    { label: 'Aktivní', value: getStatusCount('active'), color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
    { label: 'Koncepty', value: getStatusCount('draft'), color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
    { label: 'Ukončené', value: getStatusCount('completed'), color: 'text-blue-600', bg: 'bg-blue-100', icon: Users },
    { label: 'Zrušené', value: getStatusCount('cancelled'), color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statusStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Vyhledat hlasování..."
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
              <option value="draft">Koncepty</option>
              <option value="completed">Ukončené</option>
              <option value="cancelled">Zrušené</option>
            </select>
          </div>
        </div>
      </div>

      {/* Votes List */}
      <div className="space-y-4">
        {filteredVotes.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Žádná hlasování</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Žádná hlasování neodpovídají vašim kritériím.'
                : 'Zatím nebyla vytvořena žádná hlasování.'}
            </p>
          </div>
        ) : (
          filteredVotes.map((vote) => (
            <div key={vote.id}>
              <VoteCard
                vote={vote}
                onClick={() => setSelectedVote(vote)}
                onShowProgress={onShowProgress && user?.role !== 'member' ? () => onShowProgress(vote) : undefined}
              />
            </div>
          ))
        )}
      </div>

      {/* Vote Detail Modal */}
      {selectedVote && (
        <VoteDetail
          vote={selectedVote}
          onClose={() => setSelectedVote(null)}
        />
      )}
    </div>
  );
}