/*
  # Create email templates table

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `name` (text, not null) - název šablony
      - `category` (text, not null) - kategorie šablony
      - `subject` (text, not null) - předmět e-mailu
      - `content` (text, not null) - obsah e-mailu
      - `variables` (text[], default '{}') - pole dostupných proměnných
      - `is_default` (boolean, default false) - výchozí šablona
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `email_templates` table
    - Add policy for authenticated users to read templates
    - Add policy for admins and chairmen to manage templates
*/

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  variables text[] DEFAULT '{}',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read templates
CREATE POLICY "Authenticated users can read email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admins and chairmen to manage templates
CREATE POLICY "Admins and chairmen can manage email templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE email = auth.jwt() ->> 'email' 
      AND role IN ('admin', 'chairman')
    )
  );

-- Insert default email templates
INSERT INTO email_templates (id, name, category, subject, content, variables, is_default) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440041',
    'Základní šablona pro hlasování',
    'voting',
    'Hlasování: {{vote_title}}',
    '<h2>Vážený/á {{recipient_name}},</h2>
<p>Informujeme Vás o novém hlasování v rámci Vašeho společenství vlastníků.</p>

<h3>{{vote_title}}</h3>
<p>{{vote_description}}</p>

<p><strong>Termín hlasování:</strong> {{vote_start_date}} - {{vote_end_date}}</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{voting_link}}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
    HLASOVAT NYNÍ
  </a>
</div>

<p>S pozdravem,<br>{{building_name}}</p>',
    '{"recipient_name", "vote_title", "vote_description", "vote_start_date", "vote_end_date", "voting_link", "building_name"}',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440042',
    'Připomínka hlasování',
    'reminder',
    'Připomínka: {{vote_title}} - hlasování končí brzy',
    '<h2>Vážený/á {{recipient_name}},</h2>
<p>Rádi bychom Vám připomněli, že stále můžete hlasovat v následujícím hlasování:</p>

<h3>{{vote_title}}</h3>

<p><strong>Hlasování končí:</strong> {{vote_end_date}}</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{voting_link}}" style="background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
    HLASOVAT NYNÍ
  </a>
</div>

<p>Vaše účast na hlasování je důležitá pro rozhodování společenství.</p>

<p>S pozdravem,<br>{{building_name}}</p>',
    '{"recipient_name", "vote_title", "vote_end_date", "voting_link", "building_name"}',
    false
  )
ON CONFLICT (id) DO NOTHING;