import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';
import { dataCache } from '@/services/dataCache';

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
  chassis_number?: string;
  engine_number?: string;
  owner_details?: string;
  conditions_special_notes?: string;
  absolute_owner?: string;
  cylinder_capacity?: number;
  vehicle_class?: string;
  taxation_class?: string;
  status_when_registered?: string;
  country_of_origin?: string;
  manufacturer_description?: string;
  wheel_base?: number;
  overhang?: number;
  body_type?: string;
  year_of_manufacture?: number;
  colour?: string;
  previous_owners?: string;
  seating_capacity?: number;
  weight_kg?: number;
  tyre_size?: string;
  dimensions?: string;
  internal_height?: string;
  provincial_council?: string;
  date_of_first_registration?: string;
  taxes_payable?: string;
  photo_url?: string;
  insurance?: any;
  warranty?: any;
  tax_record?: any;
  [key: string]: any;
}

interface VehicleContextType {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  isLoading: boolean;
  setActiveVehicle: (vehicle: Vehicle | null) => void;
  reloadVehicles: (selectId?: number) => Promise<Vehicle[]>;
  deleteVehicle: (vehicleId: number) => Promise<boolean>;
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

  const deleteVehicle = async (vehicleId: number): Promise<boolean> => {
    try {
      await apiFetch(`/vehicles/${vehicleId}`, { method: 'DELETE' });
      dataCache.clear();
      await reloadVehicles();
      return true;
    } catch {
      return false;
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
      return;
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
        deleteVehicle,
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
