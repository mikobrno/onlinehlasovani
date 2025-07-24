import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Vote, UserVote, VotingProgress } from '../types';
import { useBuilding } from './BuildingContext';
import { useMember } from './MemberContext';
import { EmailVotingService } from '../services/emailVotingService';

interface VoteContextType {
  votes: Vote[];
  userVotes: UserVote[];
  createVote: (vote: Omit<Vote, 'id' | 'created_at' | 'updated_at'>) => void;
  updateVote: (id: string, vote: Partial<Vote>) => void;
  activateVote: (id: string) => void;
  submitVote: (voteId: string, memberId: string, answers: { questionId: string; optionIds: string[] }[]) => void;
  hasUserVoted: (voteId: string, memberId: string) => boolean;
  getVoteResults: (voteId: string) => any;
  getVoteProgress: (voteId: string) => VotingProgress | null;
  generatePersonalizedLinks: (voteId: string, memberIds?: string[]) => void;
  sendReminders: (voteId: string) => void;
  loading: boolean;
}

const VoteContext = createContext<VoteContextType | undefined>(undefined);


export function VoteProvider({ children }: { children: React.ReactNode }) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedBuilding } = useBuilding();
  const { members } = useMember();

  const fetchVotes = async () => {
    if (!selectedBuilding) {
      setVotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('building_id', selectedBuilding.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching votes:', error);
        throw error;
      } else {
        setVotes(data || []);
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
      // Fallback to mock data when network request fails
      const mockVotes = [
        {
          id: '550e8400-e29b-41d4-a716-446655440021',
          building_id: selectedBuilding.id,
          title: 'Schválení rozpočtu na rok 2024',
          description: 'Hlasování o schválení rozpočtu společenství vlastníků na následující kalendářní rok.',
          status: 'active' as const,
          start_date: '2024-01-15T00:00:00Z',
          end_date: '2024-01-30T23:59:59Z',
          questions: [
            {
              id: '1',
              question: 'Souhlasíte s navrhovaným rozpočtem na rok 2024?',
              type: 'single' as const,
              options: [
                { id: '1', text: 'Ano, souhlasím' },
                { id: '2', text: 'Ne, nesouhlasím' },
                { id: '3', text: 'Zdržuji se hlasování' }
              ]
            }
          ],
          observers: ['chairman@svj.cz'],
          created_by: '550e8400-e29b-41d4-a716-446655440012',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setVotes(mockVotes);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!selectedBuilding) {
      setUserVotes([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_votes')
        .select(`
          *,
          vote:votes!inner(building_id)
        `)
        .eq('vote.building_id', selectedBuilding.id);

      if (error) {
        console.error('Error fetching user votes:', error);
        throw error;
      } else {
        setUserVotes(data || []);
      }
    } catch (error) {
      console.error('Error fetching user votes:', error);
      // Fallback to mock data when network request fails
      const mockUserVotes = [
        {
          id: '550e8400-e29b-41d4-a716-446655440031',
          vote_id: '550e8400-e29b-41d4-a716-446655440021',
          member_id: '550e8400-e29b-41d4-a716-446655440013',
          question_id: '1',
          option_ids: ['1'],
          created_at: new Date().toISOString()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440032',
          vote_id: '550e8400-e29b-41d4-a716-446655440021',
          member_id: '550e8400-e29b-41d4-a716-446655440014',
          question_id: '1',
          option_ids: ['1'],
          created_at: new Date().toISOString()
        }
      ];
      setUserVotes(mockUserVotes);
    }
  };

  useEffect(() => {
    fetchVotes();
    fetchUserVotes();
  }, [selectedBuilding]);

  const createVote = async (voteData: Omit<Vote, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .insert([voteData])
        .select()
        .single();

      if (error) {
        console.error('Error creating vote:', error);
      } else if (data) {
        setVotes(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error creating vote:', error);
    }
  };

  const updateVote = async (id: string, voteData: Partial<Vote>) => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .update({ ...voteData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating vote:', error);
      } else if (data) {
        setVotes(prev => prev.map(vote => 
          vote.id === id ? data : vote
        ));
      }
    } catch (error) {
      console.error('Error updating vote:', error);
    }
  };

  const activateVote = async (id: string) => {
    try {
      // Update vote status to active
      await updateVote(id, { status: 'active' });
      
      // Create voting session
      const { error: sessionError } = await supabase
        .from('voting_sessions')
        .insert([{
          vote_id: id,
          total_members: members.length,
          emails_sent: 0,
          votes_received: 0
        }]);

      if (sessionError) {
        console.error('Error creating voting session:', sessionError);
      }
      
      // Send voting emails to all members
      try {
        await EmailVotingService.distributeVotingEmails(id);
        console.log('Voting emails sent successfully');
      } catch (emailError) {
        console.error('Failed to send voting emails:', emailError);
      }
      
    } catch (error) {
      console.error('Error activating vote:', error);
    }
  };

  const submitVote = async (voteId: string, memberId: string, answers: { questionId: string; optionIds: string[] }[]) => {
    try {
      const userVoteData = answers.map(answer => ({
        vote_id: voteId,
        member_id: memberId,
        question_id: answer.questionId,
        option_ids: answer.optionIds
      }));

      const { data, error } = await supabase
        .from('user_votes')
        .insert(userVoteData)
        .select();

      if (error) {
        console.error('Error submitting vote:', error);
      } else if (data) {
        setUserVotes(prev => [...prev, ...data]);
        
        // Update voting session stats
        const { error: updateError } = await supabase.rpc('increment_votes_received', {
          vote_id: voteId
        });

        if (updateError) {
          console.error('Error updating voting session:', updateError);
        }
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  const hasUserVoted = (voteId: string, memberId: string) => {
    return userVotes.some(uv => uv.vote_id === voteId && uv.member_id === memberId);
  };

  const getVoteResults = (voteId: string) => {
    const vote = votes.find(v => v.id === voteId);
    if (!vote) return null;

    const voteResponses = userVotes.filter(uv => uv.vote_id === voteId);
    
    return vote.questions.map(question => {
      const questionResponses = voteResponses.filter(uv => uv.question_id === question.id);
      const optionCounts = question.options.map(option => ({
        ...option,
        votes: questionResponses.filter(uv => uv.option_ids.includes(option.id)).length
      }));
      
      return {
        question: question.question,
        options: optionCounts,
        totalVotes: questionResponses.length
      };
    });
  };

  const getVoteProgress = (voteId: string): VotingProgress | null => {
    const votedMemberIds = userVotes
      .filter(uv => uv.vote_id === voteId)
      .map(uv => uv.member_id);
    
    const uniqueVotedMemberIds = [...new Set(votedMemberIds)];
    const votedMembers = members.filter(m => uniqueVotedMemberIds.includes(m.id));
    const pendingMembers = members.filter(m => !uniqueVotedMemberIds.includes(m.id));
    
    return {
      total_members: members.length,
      voted_members: uniqueVotedMemberIds.length,
      pending_members: pendingMembers.length,
      participation_rate: members.length > 0 ? (uniqueVotedMemberIds.length / members.length) * 100 : 0,
      member_details: {
        voted: votedMembers,
        pending: pendingMembers
      }
    };
  };

  const generatePersonalizedLinks = async (voteId: string, memberIds?: string[]) => {
    try {
      // Generate tokens for specified members or all members
      const targetMembers = memberIds ? 
        members.filter(m => memberIds.includes(m.id)) : 
        members;

      const linksData = targetMembers.map(member => ({
        vote_id: voteId,
        member_id: member.id,
        token: crypto.randomUUID() + '-' + Date.now(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }));

      const { error } = await supabase
        .from('personalized_voting_links')
        .insert(linksData);

      if (error) {
        console.error('Error generating personalized links:', error);
      } else {
        console.log('Personalized links generated successfully');
      }
    } catch (error) {
      console.error('Error generating personalized links:', error);
    }
  };

  const sendReminders = async (voteId: string) => {
    try {
      // Get members who haven't voted yet
      const progress = getVoteProgress(voteId);
      if (progress && progress.member_details.pending.length > 0) {
        const pendingMemberIds = progress.member_details.pending.map(m => m.id);
        
        // Get reminder template
        const { data: reminderTemplate } = await supabase
          .from('email_templates')
          .select('id')
          .eq('category', 'reminder')
          .eq('is_default', true)
          .single();
        
        await EmailVotingService.distributeVotingEmails(
          voteId, 
          pendingMemberIds,
          reminderTemplate?.id
        );
      }
      
      // Update last reminder sent timestamp
      const { error } = await supabase
        .from('voting_sessions')
        .update({ last_reminder_sent: new Date().toISOString() })
        .eq('vote_id', voteId);

      if (error) {
        console.error('Error updating reminder timestamp:', error);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
    }
  };
    

  return (
    <VoteContext.Provider value={{
      votes,
      userVotes,
      createVote,
      updateVote,
      activateVote,
      submitVote,
      hasUserVoted,
      getVoteResults,
      getVoteProgress,
      generatePersonalizedLinks,
      sendReminders,
      loading
    }}>
      {children}
    </VoteContext.Provider>
  );
}

export function useVote() {
  const context = useContext(VoteContext);
  if (context === undefined) {
    throw new Error('useVote must be used within a VoteProvider');
  }
  return context;
}