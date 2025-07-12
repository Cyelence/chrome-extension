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
    <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-amber-150 to-amber-200 rounded-lg overflow-hidden">
      {/* Enhanced Closet Back Wall */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-amber-100">
        {/* Realistic wood grain texture */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 1px,
              rgba(139, 69, 19, 0.2) 1px,
              rgba(139, 69, 19, 0.2) 2px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 8px,
              rgba(139, 69, 19, 0.1) 8px,
              rgba(139, 69, 19, 0.1) 16px
            )
          `
        }}></div>
        
        {/* Wood panels */}
        <div className="absolute inset-4 border border-amber-300 rounded-md opacity-30"></div>
        <div className="absolute top-8 left-8 right-8 h-px bg-amber-300 opacity-40"></div>
        <div className="absolute bottom-8 left-8 right-8 h-px bg-amber-300 opacity-40"></div>
      </div>

      {/* Enhanced Closet Lighting */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-80 rounded-full blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 rounded-full"></div>
      </div>
      
      {/* LED strip effect */}
      <div className="absolute top-1 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-60 rounded-full"></div>

      {/* Top Hanging Rod Section */}
      <div className="absolute top-8 left-4 right-4 h-48">
        <HangingRod items={hangingItems} onItemClick={onItemClick} />
      </div>

      {/* Middle Shelves Section */}
      <div className="absolute top-64 left-4 right-4 h-32">
        <ClosetShelves items={shelfItems} onItemClick={onItemClick} />
      </div>

      {/* Bottom Floor Section */}
      <div className="absolute bottom-4 left-4 right-4 h-24">
        <ClosetFloor items={floorItems} onItemClick={onItemClick} />
      </div>

      {/* Enhanced Side Walls with depth */}
      <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-300 opacity-30"></div>
      </div>
      <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-amber-300 via-amber-200 to-amber-100 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-300 opacity-30"></div>
      </div>

      {/* Closet ceiling */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-200 to-amber-100 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-300 via-transparent to-amber-300 opacity-40"></div>
      </div>

      {/* Closet floor */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-amber-300 to-amber-200 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-transparent to-amber-400 opacity-40"></div>
      </div>
    </div>
  );
};