export type MemberRole = 'admin' | 'chairman' | 'member';
export type VoteStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type EmailDeliveryStatus = 'pending' | 'sent' | 'failed' | 'bounced';

export interface User {
  id: string;
  email: string;
  role: MemberRole;
  member_id?: string;
  building_id?: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  building_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  unit_number: string;
  ownership_share: number;
  role: MemberRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  building_id: string;
  title: string;
  description: string;
  status: VoteStatus;
  start_date: string;
  end_date: string;
  questions: VoteQuestion[];
  observers?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VoteQuestion {
  id: string;
  question: string;
  options: VoteOption[];
  type: 'single' | 'multiple';
}

export interface VoteOption {
  id: string;
  text: string;
  votes?: number;
}

export interface UserVote {
  id: string;
  vote_id: string;
  member_id: string;
  question_id: string;
  option_ids: string[];
  created_at: string;
}

export interface PersonalizedVotingLink {
  id: string;
  vote_id: string;
  member_id: string;
  token: string;
  is_active: boolean;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface VotingProgress {
  total_members: number;
  voted_members: number;
  pending_members: number;
  participation_rate: number;
  member_details: {
    voted: Member[];
    pending: Member[];
  };
}