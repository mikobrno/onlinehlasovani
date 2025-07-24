/*
  # Create votes table

  1. New Tables
    - `votes`
      - `id` (uuid, primary key)
      - `building_id` (uuid, foreign key to buildings)
      - `title` (text, not null)
      - `description` (text, not null)
      - `status` (vote_status, default 'draft')
      - `start_date` (timestamptz, not null)
      - `end_date` (timestamptz, not null)
      - `questions` (jsonb, not null) - pole otázek s možnostmi
      - `observers` (text[], default '{}') - pole e-mailů pozorovatelů
      - `created_by` (uuid, foreign key to members)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `votes` table
    - Add policy for authenticated users to read votes from their building
    - Add policy for admins and chairmen to manage votes
*/

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid REFERENCES buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  status vote_status DEFAULT 'draft',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  questions jsonb NOT NULL,
  observers text[] DEFAULT '{}',
  created_by uuid REFERENCES members(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read votes from their building
CREATE POLICY "Users can read votes from their building"
  ON votes
  FOR SELECT
  TO authenticated
  USING (
    building_id IN (
      SELECT building_id FROM members 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policy for admins and chairmen to manage votes
CREATE POLICY "Admins and chairmen can manage votes"
  ON votes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.email = auth.jwt() ->> 'email' 
      AND (m.role = 'admin' OR (m.role = 'chairman' AND m.building_id = votes.building_id))
    )
  );

-- Insert demo votes
INSERT INTO votes (id, building_id, title, description, status, start_date, end_date, questions, observers, created_by) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440001',
    'Schválení rozpočtu na rok 2024',
    'Hlasování o schválení rozpočtu společenství vlastníků na následující kalendářní rok.',
    'active',
    '2024-01-15T00:00:00Z',
    '2024-01-30T23:59:59Z',
    '[{"id": "1", "question": "Souhlasíte s navrhovaným rozpočtem na rok 2024?", "type": "single", "options": [{"id": "1", "text": "Ano, souhlasím"}, {"id": "2", "text": "Ne, nesouhlasím"}, {"id": "3", "text": "Zdržuji se hlasování"}]}]',
    '{"chairman@svj.cz"}',
    '550e8400-e29b-41d4-a716-446655440012'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440001',
    'Rekonstrukce společných prostor',
    'Hlasování o rozsahu a financování rekonstrukce vstupní haly a schodiště.',
    'draft',
    '2024-02-01T00:00:00Z',
    '2024-02-15T23:59:59Z',
    '[{"id": "2", "question": "Kterou variantu rekonstrukce preferujete?", "type": "single", "options": [{"id": "4", "text": "Základní varianta (150 000 Kč)"}, {"id": "5", "text": "Rozšířená varianta (280 000 Kč)"}, {"id": "6", "text": "Luxusní varianta (450 000 Kč)"}, {"id": "7", "text": "Žádná rekonstrukce"}]}]',
    '{}',
    '550e8400-e29b-41d4-a716-446655440012'
  )
ON CONFLICT (id) DO NOTHING;