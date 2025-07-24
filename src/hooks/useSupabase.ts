import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Member } from '../types';

export function useSupabase() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch user's member data from database
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (member) {
          setUser({
            id: member.id,
            email: member.email,
            role: member.role,
            member_id: member.id,
            building_id: member.building_id
          });
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Fetch user's member data from database
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (member) {
          setUser({
            id: member.id,
            email: member.email,
            role: member.role,
            member_id: member.id,
            building_id: member.building_id
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}