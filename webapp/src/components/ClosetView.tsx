import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { ClosetDoors } from './ClosetDoors';
import { ClosetInterior } from './ClosetInterior';
import { ClosetControls } from './ClosetControls';
import { ItemModal } from './ItemModal';
import { AddItemModal } from './AddItemModal';

export const ClosetView: React.FC = () => {
  const { state } = useApp();
  const [isClosetOpen, setIsClosetOpen] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Room Background with perspective */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200">
        {/* Floor with perspective */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-amber-900 via-amber-800 to-amber-700 opacity-30 transform perspective-1000 rotateX-2"></div>
        
        {/* Wall texture with depth */}
        <div className="absolute inset-0 opacity-8" style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 3px,
              rgba(139, 69, 19, 0.05) 3px,
              rgba(139, 69, 19, 0.05) 6px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 3px,
              rgba(139, 69, 19, 0.03) 3px,
              rgba(139, 69, 19, 0.03) 6px
            )
          `
        }}></div>

        {/* Ceiling light effect */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-yellow-200 rounded-full opacity-15 blur-3xl"></div>
        
        {/* Room corners shadow */}
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-black to-transparent opacity-5"></div>
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black to-transparent opacity-5"></div>
      </div>

      {/* Controls */}
      <ClosetControls />

      {/* Main Closet with enhanced 3D effect */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="relative transform perspective-1000">
          {/* Closet Shadow */}
          <div className="absolute -bottom-8 left-8 right-8 h-16 bg-black opacity-20 blur-xl rounded-full transform scale-110"></div>
          
          {/* Closet Frame with enhanced depth */}
          <div className="relative w-[900px] h-[600px] bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 rounded-lg shadow-2xl border-4 border-amber-700 transform rotateY-1">
            {/* Frame depth effect */}
            <div className="absolute -inset-2 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg -z-10 transform translate-x-1 translate-y-1"></div>
            
            {/* Inner frame */}
            <div className="absolute inset-2 border-2 border-amber-600 rounded-md opacity-60"></div>
            
            {/* Closet Interior */}
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
          </div>

          {/* Enhanced Closet Base with legs */}
          <div className="absolute -bottom-6 left-4 right-4 h-12 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-lg shadow-lg">
            {/* Closet legs */}
            <div className="absolute -bottom-4 left-8 w-4 h-6 bg-gradient-to-b from-amber-900 to-amber-950 rounded-b-md shadow-md"></div>
            <div className="absolute -bottom-4 right-8 w-4 h-6 bg-gradient-to-b from-amber-900 to-amber-950 rounded-b-md shadow-md"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-4 h-6 bg-gradient-to-b from-amber-900 to-amber-950 rounded-b-md shadow-md"></div>
          </div>
        </div>
      </div>

      {/* Room ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-300 rounded-full opacity-5 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-orange-300 rounded-full opacity-5 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
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