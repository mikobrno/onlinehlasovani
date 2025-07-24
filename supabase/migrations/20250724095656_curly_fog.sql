/*
  # Create vote status type

  1. New Types
    - `vote_status` enum type for vote states
      - 'draft' - koncept hlasování
      - 'active' - aktivní hlasování
      - 'completed' - ukončené hlasování
      - 'cancelled' - zrušené hlasování

  2. Security
    - No RLS needed for types
*/

DO $$ BEGIN
  CREATE TYPE vote_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;