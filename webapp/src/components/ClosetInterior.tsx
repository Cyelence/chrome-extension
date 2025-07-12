import React from 'react';
import { ClosetItem } from '../types';
import { HangingRod } from './HangingRod';
import { ClosetShelves } from './ClosetShelves';
import { ClosetFloor } from './ClosetFloor';

interface ClosetInteriorProps {
  items: ClosetItem[];
  onItemClick: (item: ClosetItem) => void;
}

export const ClosetInterior: React.FC<ClosetInteriorProps> = ({ items, onItemClick }) => {
  // Categorize items for different closet areas
  const hangingItems = items.filter(item => 
    ['tops', 'dresses', 'outerwear'].includes(item.category)
  );
  
  const shelfItems = items.filter(item => 
    ['accessories', 'bags', 'jewelry'].includes(item.category)
  );
  
  const floorItems = items.filter(item => 
    ['shoes', 'bottoms'].includes(item.category)
  );

  return (
    <div className="absolute inset-2 bg-gradient-to-b from-amber-50 via-amber-100 to-amber-150 rounded-lg overflow-hidden shadow-inner">
      {/* Back Wall */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 to-amber-200">
        {/* Wood paneling */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(139, 69, 19, 0.3) 2px,
              rgba(139, 69, 19, 0.3) 4px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 12px,
              rgba(139, 69, 19, 0.2) 12px,
              rgba(139, 69, 19, 0.2) 24px
            )
          `
        }}></div>
        
        {/* Vertical panels */}
        <div className="absolute top-4 bottom-4 left-8 w-px bg-amber-300 opacity-40"></div>
        <div className="absolute top-4 bottom-4 right-8 w-px bg-amber-300 opacity-40"></div>
        <div className="absolute top-4 bottom-4 left-1/2 transform -translate-x-1/2 w-px bg-amber-300 opacity-40"></div>
      </div>

      {/* Interior Lighting */}
      <div className="absolute top-1 left-4 right-4 h-2 bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-80 rounded-full blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 rounded-full"></div>
      </div>
      
      {/* LED strip */}
      <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-70 rounded-full"></div>

      {/* Top Hanging Section */}
      <div className="absolute top-6 left-2 right-2 h-44">
        <HangingRod items={hangingItems} onItemClick={onItemClick} />
      </div>

      {/* Middle Shelves */}
      <div className="absolute top-56 left-2 right-2 h-28">
        <ClosetShelves items={shelfItems} onItemClick={onItemClick} />
      </div>

      {/* Bottom Floor */}
      <div className="absolute bottom-2 left-2 right-2 h-20">
        <ClosetFloor items={floorItems} onItemClick={onItemClick} />
      </div>

      {/* Side Walls */}
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-r from-amber-300 to-amber-200 shadow-inner"></div>
      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-l from-amber-300 to-amber-200 shadow-inner"></div>

      {/* Ceiling */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-amber-200 to-amber-100 shadow-inner"></div>

      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-amber-300 to-amber-200 shadow-inner"></div>
    </div>
  );
};