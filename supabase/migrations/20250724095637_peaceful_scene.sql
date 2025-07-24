/*
  # Create members table

  1. New Tables
    - `members`
      - `id` (uuid, primary key)
      - `building_id` (uuid, foreign key to buildings)
      - `email` (text, unique, not null)
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `phone` (text, nullable)
      - `unit_number` (text, not null)
      - `ownership_share` (numeric, not null)
      - `role` (member_role, default 'member')
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `members` table
    - Add policy for authenticated users to read members from their building
    - Add policy for admins and chairmen to manage members
*/

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid REFERENCES buildings(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  unit_number text NOT NULL,
  ownership_share numeric NOT NULL DEFAULT 0,
  role member_role DEFAULT 'member',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read members from their building
CREATE POLICY "Users can read members from their building"
  ON members
  FOR SELECT
  TO authenticated
  USING (
    building_id IN (
      SELECT building_id FROM members 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policy for admins and chairmen to manage members
CREATE POLICY "Admins and chairmen can manage members"
  ON members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.email = auth.jwt() ->> 'email' 
      AND (m.role = 'admin' OR (m.role = 'chairman' AND m.building_id = members.building_id))
    )
  );

-- Insert demo members
INSERT INTO members (id, building_id, email, first_name, last_name, phone, unit_number, ownership_share, role, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'admin@svj.cz', 'Administrátor', 'Systému', '+420 555 000 111', 'ADM', 0, 'admin', true),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'chairman@svj.cz', 'Marie', 'Svobodová', '+420 987 654 321', '15', 8.3, 'chairman', true),
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'member@svj.cz', 'Jan', 'Novák', '+420 123 456 789', '12', 12.5, 'member', true),
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 'petr.dvorak@email.com', 'Petr', 'Dvořák', '+420 111 222 333', '18', 10.2, 'member', true),
  ('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'anna.novotna@email.com', 'Anna', 'Novotná', '+420 444 555 666', '22', 9.8, 'member', true)
ON CONFLICT (id) DO NOTHING;