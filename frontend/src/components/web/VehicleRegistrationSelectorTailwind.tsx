import React, { useState, useCallback, useId } from 'react';
import { VEHICLE_DATA, VehicleTypeItem } from './vehicleData';

export interface VehicleRegistrationSelectorTailwindProps {
  selectedType?: string;
  onSelectType?: (vehicle: VehicleTypeItem) => void;
  stepTitle?: string;
  label?: string;
  vehicles?: VehicleTypeItem[];
  showFormPreview?: boolean;
  className?: string;
}

/**
 * Vehicle Registration Selector - Tailwind CSS Edition
 * High-performance, lightweight pure CSS transitions and styling.
 */
export const VehicleRegistrationSelectorTailwind: React.FC<VehicleRegistrationSelectorTailwindProps> = ({
  selectedType,
  onSelectType,
  stepTitle = 'Step 1: Basics & Specs',
  label = 'Vehicle Type',
  vehicles = VEHICLE_DATA,
  showFormPreview = true,
  className = '',
}) => {
  const [internalSelected, setInternalSelected] = useState<string>(
    selectedType || (vehicles.length > 0 ? vehicles[0].id : 'car')
  );

  const activeId = selectedType !== undefined ? selectedType : internalSelected;
  const groupId = useId();

  const handleSelect = useCallback(
    (item: VehicleTypeItem) => {
      setInternalSelected(item.id);
      if (onSelectType) onSelectType(item);
    },
    [onSelectType]
  );

  return (
    <section
      className={`w-full max-w-[1100px] mx-auto p-6 md:p-8 bg-[#0a122e] text-white font-sans ${className}`.trim()}
      aria-labelledby={`${groupId}-title`}>
      {/* Header */}
      <div className="mb-6">
        <h2 id={`${groupId}-title`} className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">
          {stepTitle}
        </h2>
        <p className="text-sm font-medium text-slate-400">{label}</p>
      </div>

      {/* 5-Card Horizontal Row Layout */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-8"
        role="radiogroup"
        aria-label={label}>
        {vehicles.map((item, index) => {
          const isSelected = activeId === item.id;
          const staggerDelays = ['delay-0', 'delay-75', 'delay-150', 'delay-200', 'delay-300'];

          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleSelect(item)}
              style={{ animationDelay: `${index * 60}ms` }}
              className={`
                relative flex flex-col justify-between h-[168px] p-3 md:p-3.5 rounded-xl text-left
                cursor-pointer select-none overflow-hidden outline-none
                transform transition-all duration-300 ease-out will-change-transform
                animate-in fade-in slide-in-from-bottom-3 duration-500
                ${staggerDelays[index] || ''}
                ${
                  isSelected
                    ? 'border-2 border-[#2b7fff] bg-gradient-to-b from-[#152c56] to-[#101c36] shadow-[0_0_25px_rgba(43,127,255,0.45),inset_0_0_15px_rgba(43,127,255,0.2)] -translate-y-0.5 scale-[1.02]'
                    : 'border border-[#233047] bg-[#162032] hover:bg-[#1a273d] hover:border-[#3b5377] hover:-translate-y-1 hover:shadow-xl'
                }
              `}>
              {/* Checkmark indicator badge */}
              <div
                className={`
                  absolute top-2.5 right-2.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold
                  transition-all duration-300
                  ${isSelected ? 'opacity-100 scale-100 bg-[#2b7fff] text-white shadow-[0_0_8px_#2b7fff]' : 'opacity-0 scale-50'}
                `}>
                ✓
              </div>

              {/* Vehicle Render Image */}
              <div className="w-full h-24 flex items-center justify-center pointer-events-none">
                <img
                  src={item.image}
                  alt={item.label}
                  className={`max-w-full max-h-full object-contain drop-shadow-md transition-transform duration-300 ${
                    isSelected ? 'scale-105 drop-shadow-[0_8px_16px_rgba(43,127,255,0.3)]' : 'group-hover:scale-105'
                  }`}
                  loading="eager"
                />
              </div>

              {/* Label */}
              <div className="mt-1">
                <span
                  className={`text-xs md:text-[13px] font-bold tracking-wider uppercase transition-colors duration-200 ${
                    isSelected ? 'text-white drop-shadow-[0_0_8px_rgba(43,127,255,0.6)]' : 'text-slate-300'
                  }`}>
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form Fields Preview */}
      {showFormPreview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-[#1a263d]">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-400">Brand / Make</span>
            <div className="bg-[#131b2c] border border-[#233047] rounded-lg px-3.5 py-2.5 text-sm text-slate-300 hover:border-[#3b5377] transition-colors cursor-pointer">
              Select Brand (e.g. Audi, Honda, Toyota)
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-400">Select Model</span>
            <div className="bg-[#131b2c] border border-[#233047] rounded-lg px-3.5 py-2.5 text-sm text-slate-300 hover:border-[#3b5377] transition-colors cursor-pointer">
              Select Model
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VehicleRegistrationSelectorTailwind;
