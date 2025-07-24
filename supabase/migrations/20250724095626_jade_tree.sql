/*
  # Create buildings table

  1. New Tables
    - `buildings`
      - `id` (uuid, primary key)
      - `name` (text, not null) - název budovy
      - `address` (text, not null) - adresa budovy
      - `description` (text, nullable) - popis budovy
      - `is_active` (boolean, default true) - aktivní stav
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `buildings` table
    - Add policy for authenticated users to read buildings
    - Add policy for admins to manage buildings
*/

CREATE TABLE IF NOT EXISTS buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read buildings
CREATE POLICY "Authenticated users can read buildings"
  ON buildings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admins to manage buildings
CREATE POLICY "Admins can manage buildings"
  ON buildings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.email = auth.jwt() ->> 'email' 
      AND members.role = 'admin'
    )
  );

-- Insert demo buildings
INSERT INTO buildings (id, name, address, description, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Bytový dům Náměstí míru 12', 'Náměstí míru 12, 120 00 Praha 2', 'Historický bytový dům v centru Prahy s 24 bytovými jednotkami.', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Rezidence Karlín', 'Thámova 15, 180 00 Praha 8', 'Moderní bytový komplex s 48 jednotkami a podzemním parkováním.', true)
ON CONFLICT (id) DO NOTHING;