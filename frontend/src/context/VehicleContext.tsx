import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';

export interface Vehicle {
  id: number;
  user_id: number;
  type: string;
  brand: string;
  model: string;
  registration_number: string;
  fuel_type: string;
  transmission: string;
  current_odometer: number;
  engine_capacity?: string;
  notes?: string;
  insurance?: any;
  warranty?: any;
  tax_record?: any;
}

interface VehicleContextType {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  isLoading: boolean;
  setActiveVehicle: (vehicle: Vehicle | null) => void;
  reloadVehicles: (selectId?: number) => Promise<Vehicle[]>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadVehicles = async (selectId?: number): Promise<Vehicle[]> => {
    if (!isAuthenticated || !user) {
      setVehicles([]);
      setActiveVehicle(null);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    try {
      const data = await apiFetch<Vehicle[]>('/vehicles');
      // Ensure only vehicles belonging to current user are kept
      const userVehicles = Array.isArray(data) ? data.filter((v) => !v.user_id || v.user_id === user.id) : [];
      setVehicles(userVehicles);

      if (userVehicles.length > 0) {
        if (selectId) {
          const found = userVehicles.find((v) => v.id === selectId);
          setActiveVehicle(found || userVehicles[0]);
        } else if (!activeVehicle || activeVehicle.user_id !== user.id || !userVehicles.some((v) => v.id === activeVehicle.id)) {
          setActiveVehicle(userVehicles[0]);
        } else {
          // Update existing active vehicle object reference
          const updated = userVehicles.find((v) => v.id === activeVehicle.id);
          setActiveVehicle(updated || userVehicles[0]);
        }
      } else {
        setActiveVehicle(null);
      }
      return userVehicles;
    } catch {
      setVehicles([]);
      setActiveVehicle(null);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Reset and reload vehicles whenever the authenticated user ID changes
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && user?.id) {
      setVehicles([]);
      setActiveVehicle(null);
      setIsLoading(true);
      reloadVehicles();
    } else {
      setVehicles([]);
      setActiveVehicle(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, user?.id]);

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        isLoading,
        setActiveVehicle,
        reloadVehicles,
      }}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
};
