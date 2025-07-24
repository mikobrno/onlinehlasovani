/*
  # Create email delivery logs table

  1. New Tables
    - `email_delivery_logs`
      - `id` (uuid, primary key)
      - `vote_id` (uuid, foreign key to votes)
      - `member_id` (uuid, foreign key to members)
      - `template_id` (uuid, foreign key to email_templates)
      - `recipient_email` (text, not null)
      - `subject` (text, not null)
      - `status` (text, not null) - 'pending', 'sent', 'failed', 'bounced'
      - `error_message` (text, nullable)
      - `sent_at` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `email_delivery_logs` table
    - Add policy for admins and chairmen to read logs from their building
*/

CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id uuid REFERENCES votes(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  template_id uuid REFERENCES email_templates(id),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins and chairmen to read logs from their building
CREATE POLICY "Admins and chairmen can read email logs"
  ON email_delivery_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN votes v ON v.building_id = m.building_id
      WHERE m.email = auth.jwt() ->> 'email' 
      AND (m.role = 'admin' OR m.role = 'chairman')
      AND v.id = email_delivery_logs.vote_id
    )
  );