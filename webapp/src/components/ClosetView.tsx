import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { ClosetDoors } from './ClosetDoors';
import { ClosetInterior } from './ClosetInterior';
import { ClosetControls } from './ClosetControls';
import { ItemModal } from './ItemModal';
import { AddItemModal } from './AddItemModal';

export const ClosetView: React.FC = () => {
  const { state } = useApp();
  const [isClosetOpen, setIsClosetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Room Background */}
      <div className="absolute inset-0">
        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-900 via-amber-800 to-amber-700 opacity-20"></div>
        
        {/* Wall */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-200">
          {/* Wall texture */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(0, 0, 0, 0.1) 10px,
                rgba(0, 0, 0, 0.1) 20px
              )
            `
          }}></div>
        </div>

        {/* Room lighting */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-yellow-200 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Controls overlay */}
      <ClosetControls />

      {/* Main Wardrobe Closet */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="relative">
          {/* Wardrobe Shadow */}
          <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black opacity-30 blur-xl rounded-full"></div>
          
          {/* Main Wardrobe Structure */}
          <div className="relative w-[800px] h-[600px] bg-gradient-to-b from-amber-800 via-amber-700 to-amber-900 rounded-lg shadow-2xl">
            {/* Wardrobe Frame */}
            <div className="absolute inset-0 border-4 border-amber-900 rounded-lg">
              {/* Wood grain texture */}
              <div className="absolute inset-0 rounded-lg opacity-30" style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(139, 69, 19, 0.3) 2px,
                    rgba(139, 69, 19, 0.3) 4px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 1px,
                    rgba(139, 69, 19, 0.2) 1px,
                    rgba(139, 69, 19, 0.2) 2px
                  )
                `
              }}></div>
            </div>

            {/* Top Crown Molding */}
            <div className="absolute -top-4 left-0 right-0 h-8 bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-lg shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 opacity-50 rounded-t-lg"></div>
            </div>

            {/* Closet Interior (when open) */}
            {isClosetOpen && (
              <ClosetInterior 
                items={state.items}
                onItemClick={setSelectedItem}
              />
            )}
            
            {/* Closet Doors */}
            <ClosetDoors 
              isOpen={isClosetOpen}
              onToggle={() => setIsClosetOpen(!isClosetOpen)}
            />

            {/* Center Divider */}
            <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-2 bg-gradient-to-b from-amber-800 to-amber-900 z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-700 to-amber-800 opacity-60"></div>
            </div>
          </div>

          {/* Wardrobe Base */}
          <div className="absolute -bottom-2 left-2 right-2 h-8 bg-gradient-to-b from-amber-900 to-amber-950 rounded-b-lg shadow-lg">
            {/* Base molding */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-sm"></div>
            
            {/* Feet */}
            <div className="absolute -bottom-2 left-8 w-6 h-4 bg-gradient-to-b from-amber-950 to-black rounded-b-md"></div>
            <div className="absolute -bottom-2 right-8 w-6 h-4 bg-gradient-to-b from-amber-950 to-black rounded-b-md"></div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-4 bg-gradient-to-b from-amber-950 to-black rounded-b-md"></div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedItem && (
        <ItemModal 
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {state.modals.addItem && <AddItemModal />}
    </div>
  );
};