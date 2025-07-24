/*
  # Create user votes table

  1. New Tables
    - `user_votes`
      - `id` (uuid, primary key)
      - `vote_id` (uuid, foreign key to votes)
      - `member_id` (uuid, foreign key to members)
      - `question_id` (text, not null) - ID otázky z JSON
      - `option_ids` (text[], not null) - pole ID vybraných možností
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `user_votes` table
    - Add policy for users to read their own votes
    - Add policy for users to insert their own votes
    - Add policy for admins and chairmen to read all votes from their building
*/

CREATE TABLE IF NOT EXISTS user_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id uuid REFERENCES votes(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  option_ids text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vote_id, member_id, question_id)
);

ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own votes
CREATE POLICY "Users can read their own votes"
  ON user_votes
  FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policy for users to insert their own votes
CREATE POLICY "Users can insert their own votes"
  ON user_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id IN (
      SELECT id FROM members 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policy for admins and chairmen to read all votes from their building
CREATE POLICY "Admins and chairmen can read building votes"
  ON user_votes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN votes v ON v.building_id = m.building_id
      WHERE m.email = auth.jwt() ->> 'email' 
      AND (m.role = 'admin' OR m.role = 'chairman')
      AND v.id = user_votes.vote_id
    )
  );

-- Insert demo user votes
INSERT INTO user_votes (id, vote_id, member_id, question_id, option_ids) VALUES
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', '1', '{"1"}'),
  ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440014', '1', '{"1"}')
ON CONFLICT (vote_id, member_id, question_id) DO NOTHING;