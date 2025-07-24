import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Building } from '../types';

interface BuildingContextType {
  buildings: Building[];
  selectedBuilding: Building | null;
  setSelectedBuilding: (building: Building) => void;
  addBuilding: (building: Omit<Building, 'id' | 'created_at' | 'updated_at'>) => void;
  updateBuilding: (id: string, building: Partial<Building>) => void;
  deleteBuilding: (id: string) => void;
  fetchBuildings: () => void;
  loading: boolean;
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined);


export function BuildingProvider({ children }: { children: React.ReactNode }) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBuildings = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching buildings:', error);
        // Fallback to mock data when Supabase fails
        const mockBuildings = [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Bytový dům Náměstí míru 12',
            address: 'Náměstí míru 12, 120 00 Praha 2',
            description: 'Historický bytový dům v centru Prahy s 24 bytovými jednotkami.',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setBuildings(mockBuildings);
        if (!selectedBuilding) {
          setSelectedBuilding(mockBuildings[0]);
        }
      } else {
        setBuildings(data || []);
        if (!selectedBuilding && data && data.length > 0) {
          setSelectedBuilding(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      // Fallback to mock data when network request fails
      const mockBuildings = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Bytový dům Náměstí míru 12',
          address: 'Náměstí míru 12, 120 00 Praha 2',
          description: 'Historický bytový dům v centru Prahy s 24 bytovými jednotkami.',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setBuildings(mockBuildings);
      if (!selectedBuilding) {
        setSelectedBuilding(mockBuildings[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const addBuilding = async (buildingData: Omit<Building, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .insert([buildingData])
        .select()
        .single();

      if (error) {
        console.error('Error adding building:', error);
      } else if (data) {
        setBuildings(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error adding building:', error);
    }
  };

  const updateBuilding = async (id: string, buildingData: Partial<Building>) => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .update({ ...buildingData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating building:', error);
      } else if (data) {
        setBuildings(prev => prev.map(building => 
          building.id === id ? data : building
        ));
        if (selectedBuilding?.id === id) {
          setSelectedBuilding(data);
        }
      }
    } catch (error) {
      console.error('Error updating building:', error);
    }
  };

  const deleteBuilding = async (id: string) => {
    try {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting building:', error);
      } else {
        setBuildings(prev => prev.filter(building => building.id !== id));
        if (selectedBuilding?.id === id) {
          const remainingBuildings = buildings.filter(b => b.id !== id);
          setSelectedBuilding(remainingBuildings[0] || null);
        }
      }
    } catch (error) {
      console.error('Error deleting building:', error);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  return (
    <BuildingContext.Provider value={{
      buildings,
      selectedBuilding,
      setSelectedBuilding,
      addBuilding,
      updateBuilding,
      deleteBuilding,
      fetchBuildings,
      loading
    }}>
      {children}
    </BuildingContext.Provider>
  );
}

export function useBuilding() {
  const context = useContext(BuildingContext);
  if (context === undefined) {
    throw new Error('useBuilding must be used within a BuildingProvider');
  }
  return context;
}