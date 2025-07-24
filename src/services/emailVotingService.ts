import { supabase } from '../lib/supabase';

export interface EmailVotingData {
  vote: any;
  member: any;
  building: any;
  hasVoted: boolean;
  linkId: string;
}

export interface VoteAnswer {
  questionId: string;
  optionIds: string[];
}

export class EmailVotingService {
  static async getVotingData(token: string): Promise<EmailVotingData> {
    try {
      // Try Edge Function first
      const { data, error } = await supabase.functions.invoke('get-voting-data', {
        body: { token }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Edge Function failed, falling back to direct DB query:', error);
      
      // Fallback to direct database query
      const { data: votingLink, error: linkError } = await supabase
        .from('personalized_voting_links')
        .select(`
          *,
          votes (*,
            buildings (name, address)
          ),
          members (*)
        `)
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (linkError || !votingLink) {
        throw new Error('Invalid or expired voting link');
      }

      // Check if link has expired
      if (new Date(votingLink.expires_at) < new Date()) {
        throw new Error('Voting link has expired');
      }

      // Check if vote is active
      if (votingLink.votes.status !== 'active') {
        throw new Error('Voting is not currently active');
      }

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('user_votes')
        .select('id')
        .eq('vote_id', votingLink.vote_id)
        .eq('member_id', votingLink.member_id)
        .limit(1);

      const hasVoted = existingVote && existingVote.length > 0;

      return {
        vote: votingLink.votes,
        member: votingLink.members,
        building: votingLink.votes.buildings,
        hasVoted,
        linkId: votingLink.id
      };
    }
  }

  static async submitVote(token: string, answers: VoteAnswer[]): Promise<any> {
    try {
      // Try Edge Function first
      const { data, error } = await supabase.functions.invoke('process-email-vote', {
        body: { token, answers }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Edge Function failed, falling back to direct DB operation:', error);
      
      // Fallback to direct database operations
      const { data: votingLink, error: linkError } = await supabase
        .from('personalized_voting_links')
        .select(`
          *,
          votes (*),
          members (*)
        `)
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (linkError || !votingLink) {
        throw new Error('Invalid or expired voting link');
      }

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('user_votes')
        .select('id')
        .eq('vote_id', votingLink.vote_id)
        .eq('member_id', votingLink.member_id)
        .limit(1);

      if (existingVote && existingVote.length > 0) {
        throw new Error('You have already voted');
      }

      // Prepare vote data
      const userVoteData = answers.map(answer => ({
        vote_id: votingLink.vote_id,
        member_id: votingLink.member_id,
        question_id: answer.questionId,
        option_ids: answer.optionIds
      }));

      // Insert votes
      const { error: voteError } = await supabase
        .from('user_votes')
        .insert(userVoteData);

      if (voteError) {
        throw new Error('Failed to record vote');
      }

      // Mark voting link as used
      await supabase
        .from('personalized_voting_links')
        .update({
          is_active: false,
          used_at: new Date().toISOString()
        })
        .eq('id', votingLink.id);

      return {
        success: true,
        message: 'Vote recorded successfully',
        member: votingLink.members,
        vote: votingLink.votes
      };
    }
  }

  static async sendVotingEmail(voteId: string, memberId: string, templateId?: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('send-voting-email', {
      body: { voteId, memberId, templateId }
    });

    if (error) throw error;
    return data;
  }

  static async distributeVotingEmails(voteId: string, memberIds?: string[], templateId?: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('distribute-voting-emails', {
      body: { voteId, memberIds, templateId }
    });

    if (error) throw error;
    return data;
  }
}