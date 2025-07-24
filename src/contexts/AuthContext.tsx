import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, MemberRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login as admin for development
    const autoLogin = async () => {
      try {
        // Fetch admin user from database
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('email', 'admin@svj.cz')
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
      } catch (error) {
        console.error('Auto-login failed:', error);
      } finally {
        setLoading(false);
      }
    };

    autoLogin();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setLoading(false);
        return false;
      }

      if (data.user) {
        // Fetch user's member data from database
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('email', data.user.email)
          .single();

        if (member) {
          setUser({
            id: member.id,
            email: member.email,
            role: member.role,
            member_id: member.id,
            building_id: member.building_id
          });
          setLoading(false);
          return true;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    
    setLoading(false);
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}