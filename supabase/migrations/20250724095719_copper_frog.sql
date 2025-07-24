/*
  # Create personalized voting links table

  1. New Tables
    - `personalized_voting_links`
      - `id` (uuid, primary key)
      - `vote_id` (uuid, foreign key to votes)
      - `member_id` (uuid, foreign key to members)
      - `token` (text, unique, not null) - unikátní token pro hlasování
      - `is_active` (boolean, default true) - aktivní stav odkazu
      - `expires_at` (timestamptz, not null) - datum expirace
      - `used_at` (timestamptz, nullable) - datum použití
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `personalized_voting_links` table
    - Add policy for public access to read active links by token
    - Add policy for admins and chairmen to manage links
*/

CREATE TABLE IF NOT EXISTS personalized_voting_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id uuid REFERENCES votes(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE personalized_voting_links ENABLE ROW LEVEL SECURITY;

-- Policy for public access to read active links by token
CREATE POLICY "Public can read active links by token"
  ON personalized_voting_links
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND expires_at > now());

-- Policy for admins and chairmen to manage links
CREATE POLICY "Admins and chairmen can manage voting links"
  ON personalized_voting_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN votes v ON v.building_id = m.building_id
      WHERE m.email = auth.jwt() ->> 'email' 
      AND (m.role = 'admin' OR m.role = 'chairman')
      AND v.id = personalized_voting_links.vote_id
    )
  );