import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Member } from '../types';
import { useBuilding } from './BuildingContext';

interface MemberContextType {
  members: Member[];
  addMember: (member: Omit<Member, 'id' | 'created_at' | 'updated_at'>) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMemberByEmail: (email: string) => Member | undefined;
  importMembersFromCSV: (csvData: string) => void;
  clearAllData: () => void;
  loading: boolean;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);


export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedBuilding } = useBuilding();

  const fetchMembers = async () => {
    if (!selectedBuilding) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('building_id', selectedBuilding.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      } else {
        setMembers(data || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      // Fallback to mock data when network request fails
      const mockMembers = [
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          building_id: selectedBuilding.id,
          email: 'admin@svj.cz',
          first_name: 'Administrátor',
          last_name: 'Systému',
          phone: '+420 555 000 111',
          unit_number: 'ADM',
          ownership_share: 0,
          role: 'admin' as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440012',
          building_id: selectedBuilding.id,
          email: 'chairman@svj.cz',
          first_name: 'Marie',
          last_name: 'Svobodová',
          phone: '+420 987 654 321',
          unit_number: '15',
          ownership_share: 8.3,
          role: 'chairman' as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440013',
          building_id: selectedBuilding.id,
          email: 'member@svj.cz',
          first_name: 'Jan',
          last_name: 'Novák',
          phone: '+420 123 456 789',
          unit_number: '12',
          ownership_share: 12.5,
          role: 'member' as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440014',
          building_id: selectedBuilding.id,
          email: 'petr.dvorak@email.com',
          first_name: 'Petr',
          last_name: 'Dvořák',
          phone: '+420 111 222 333',
          unit_number: '18',
          ownership_share: 10.2,
          role: 'member' as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440015',
          building_id: selectedBuilding.id,
          email: 'anna.novotna@email.com',
          first_name: 'Anna',
          last_name: 'Novotná',
          phone: '+420 444 555 666',
          unit_number: '22',
          ownership_share: 9.8,
          role: 'member' as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setMembers(mockMembers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedBuilding]);

  const addMember = async (memberData: Omit<Member, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert([memberData])
        .select()
        .single();

      if (error) {
        console.error('Error adding member:', error);
      } else if (data) {
        setMembers(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const updateMember = async (id: string, memberData: Partial<Member>) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .update({ ...memberData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating member:', error);
      } else if (data) {
        setMembers(prev => prev.map(member => 
          member.id === id ? data : member
        ));
      }
    } catch (error) {
      console.error('Error updating member:', error);
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting member:', error);
      } else {
        setMembers(prev => prev.filter(member => member.id !== id));
      }
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const getMemberByEmail = (email: string) => {
    return members.find(member => member.email === email);
  };

  const importMembersFromCSV = async (csvData: string) => {
    // Basic CSV parsing - in real app, use a proper CSV parser
    const lines = csvData.split('\n');
    
    const newMembersData = lines.map((line) => {
      const values = line.split(',');
      return {
        building_id: selectedBuilding?.id || '1',
        email: values[0]?.trim() || '',
        first_name: values[1]?.trim() || '',
        last_name: values[2]?.trim() || '',
        phone: values[3]?.trim() || '',
        unit_number: values[4]?.trim() || '',
        ownership_share: parseFloat(values[5]) || 0,
        role: 'member' as const,
        is_active: true
      };
    }).filter(member => member.email);

    try {
      const { data, error } = await supabase
        .from('members')
        .insert(newMembersData)
        .select();

      if (error) {
        console.error('Error importing members:', error);
      } else if (data) {
        setMembers(prev => [...data, ...prev]);
      }
    } catch (error) {
      console.error('Error importing members:', error);
    }
  };

  const clearAllData = async () => {
    if (!selectedBuilding) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('building_id', selectedBuilding.id);

      if (error) {
        console.error('Error clearing members:', error);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error clearing members:', error);
    }
  };

  return (
    <MemberContext.Provider value={{
      members,
      addMember,
      updateMember,
      deleteMember,
      getMemberByEmail,
      importMembersFromCSV,
      clearAllData,
      loading
    }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const context = useContext(MemberContext);
  if (context === undefined) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return context;
}