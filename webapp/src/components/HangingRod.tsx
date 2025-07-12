import React from 'react';
import { ClosetItem } from '../types';
import { ClothingHanger } from './ClothingHanger';

interface HangingRodProps {
  items: ClosetItem[];
  onItemClick: (item: ClosetItem) => void;
}

export const HangingRod: React.FC<HangingRodProps> = ({ items, onItemClick }) => {
  return (
    <div className="relative w-full h-full">
      {/* Enhanced Hanging Rod */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600 rounded-full shadow-lg">
        {/* Rod highlights */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 rounded-full"></div>
        
        {/* Rod supports with enhanced detail */}
        <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-md shadow-md border border-gray-400">
          <div className="absolute inset-1 bg-gray-400 rounded-sm"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-4 bg-gray-600 rounded-full"></div>
        </div>
        <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-8 bg-gradient-to-l from-gray-500 to-gray-600 rounded-md shadow-md border border-gray-400">
          <div className="absolute inset-1 bg-gray-400 rounded-sm"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-4 bg-gray-600 rounded-full"></div>
        </div>
      </div>

      {/* Hanging Clothes */}
      <div className="absolute top-4 left-0 right-0 flex justify-start items-start space-x-1 overflow-x-auto">
        {items.slice(0, 12).map((item, index) => (
          <ClothingHanger 
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
            style={{ 
              zIndex: items.length - index,
              marginLeft: index > 0 ? '-8px' : '0'
            }}
          />
        ))}
        
        {/* Enhanced empty hangers */}
        {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, index) => (
          <div 
            key={`empty-${index}`}
            className="flex-shrink-0 w-12 h-32 relative hover:scale-105 transition-transform duration-200"
            style={{ marginLeft: index > 0 || items.length > 0 ? '-8px' : '0' }}
          >
            {/* Enhanced empty hanger */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full shadow-sm"></div>
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-6 border-2 border-gray-300 rounded-t-full bg-gradient-to-b from-gray-200 to-gray-300">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gray-400 rounded-full"></div>
            </div>
            
            {/* Hanger hook */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gray-400 rounded-full"></div>
          </div>
        ))}
      </div>

      {/* Rod shadow on back wall */}
      <div className="absolute top-4 left-0 right-0 h-2 bg-black opacity-10 blur-sm rounded-full"></div>
    </div>
  );
};