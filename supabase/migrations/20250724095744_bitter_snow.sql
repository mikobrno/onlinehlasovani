/*
  # Create voting sessions table

  1. New Tables
    - `voting_sessions`
      - `id` (uuid, primary key)
      - `vote_id` (uuid, foreign key to votes, unique)
      - `total_members` (integer, not null)
      - `emails_sent` (integer, default 0)
      - `votes_received` (integer, default 0)
      - `last_reminder_sent` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `voting_sessions` table
    - Add policy for admins and chairmen to read sessions from their building
*/

CREATE TABLE IF NOT EXISTS voting_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id uuid UNIQUE REFERENCES votes(id) ON DELETE CASCADE,
  total_members integer NOT NULL,
  emails_sent integer DEFAULT 0,
  votes_received integer DEFAULT 0,
  last_reminder_sent timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for admins and chairmen to read sessions from their building
CREATE POLICY "Admins and chairmen can read voting sessions"
  ON voting_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN votes v ON v.building_id = m.building_id
      WHERE m.email = auth.jwt() ->> 'email' 
      AND (m.role = 'admin' OR m.role = 'chairman')
      AND v.id = voting_sessions.vote_id
    )
  );