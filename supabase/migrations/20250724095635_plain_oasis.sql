/*
  # Create member role type

  1. New Types
    - `member_role` enum type for user roles
      - 'admin' - administrátor systému
      - 'chairman' - předseda společenství
      - 'member' - člen společenství

  2. Security
    - No RLS needed for types
*/

DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('admin', 'chairman', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;