import React, { useState, useCallback, useId } from 'react';
import styles from './VehicleRegistrationSelector.module.css';
import { VEHICLE_DATA, VehicleTypeItem } from './vehicleData';

export interface VehicleRegistrationSelectorProps {
  /**
   * Currently active/selected vehicle type ID (e.g., 'car', 'bike').
   * If not supplied, the component operates in self-managed state with 'car' as default.
   */
  selectedType?: string;

  /**
   * Callback fired whenever the user selects a vehicle card.
   */
  onSelectType?: (vehicle: VehicleTypeItem) => void;

  /**
   * Main step heading. Defaults to "Step 1: Basics & Specs".
   */
  stepTitle?: string;

  /**
   * Sub-label for the selection group. Defaults to "Vehicle Type".
   */
  label?: string;

  /**
   * Custom list of vehicle items. Defaults to the 5 standard categories matching image_1.png.
   */
  vehicles?: VehicleTypeItem[];

  /**
   * Whether to render the mock input fields below the cards (Brand/Make & Model)
   * to replicate the complete registration screen preview from image_1.png. Defaults to true.
   */
  showFormPreview?: boolean;

  /**
   * Optional custom CSS class name for the wrapper.
   */
  className?: string;
}

/**
 * Premium Web-based Vehicle Registration Selector Component
 * Inspired by image_1.png with dark theme (#0a122e), 5-vehicle horizontal cards,
 * cascading entry animations, hardware-accelerated transitions, and luminous active states.
 */
export const VehicleRegistrationSelector: React.FC<VehicleRegistrationSelectorProps> = ({
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

  const handleCardClick = useCallback(
    (item: VehicleTypeItem) => {
      setInternalSelected(item.id);
      if (onSelectType) {
        onSelectType(item);
      }
    },
    [onSelectType]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let targetIndex = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        targetIndex = (index + 1) % vehicles.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        targetIndex = (index - 1 + vehicles.length) % vehicles.length;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardClick(vehicles[index]);
        return;
      }

      if (targetIndex !== -1) {
        handleCardClick(vehicles[targetIndex]);
        const nextButton = document.getElementById(`${groupId}-card-${vehicles[targetIndex].id}`);
        nextButton?.focus();
      }
    },
    [vehicles, groupId, handleCardClick]
  );

  return (
    <section
      className={`${styles.container} ${className}`.trim()}
      aria-labelledby={`${groupId}-title`}>
      {/* Header section */}
      <div className={styles.headerWrapper}>
        <h2 id={`${groupId}-title`} className={styles.stepTitle}>
          {stepTitle}
        </h2>
        <p className={styles.label}>{label}</p>
      </div>

      {/* 5-Card Horizontal Row Layout */}
      <div
        className={styles.cardRow}
        role="radiogroup"
        aria-label={label}>
        {vehicles.map((item, index) => {
          const isSelected = activeId === item.id;

          return (
            <button
              key={item.id}
              id={`${groupId}-card-${item.id}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              className={`${styles.card} ${isSelected ? styles.cardActive : ''}`}
              onClick={() => handleCardClick(item)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              title={`${item.label} - ${item.sublabel}`}>
              {/* Active Glow Vignette Overlay */}
              {isSelected && <div className={styles.cardActiveOverlay} />}

              {/* Active Selection Checkmark Badge */}
              <div className={styles.activeBadge} aria-hidden="true">
                ✓
              </div>

              {/* Vehicle Realistic Render Illustration */}
              <div className={styles.imageContainer}>
                <img
                  src={item.image}
                  alt={item.label}
                  className={styles.vehicleImage}
                  loading="eager"
                  decoding="async"
                />
              </div>

              {/* Card Label */}
              <div className={styles.labelContainer}>
                <span className={styles.cardText}>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form Fields Preview (matching bottom section of image_1.png) */}
      {showFormPreview && (
        <div className={styles.formRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Brand / Make</label>
            <div className={styles.mockInput}>Select Brand (e.g. Audi, Honda, Toyota)</div>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Select Model</label>
            <div className={styles.mockInput}>Select Model</div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VehicleRegistrationSelector;
