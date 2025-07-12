import React from 'react';
import { ClosetItem } from '../types';

interface ClosetShelvesProps {
  items: ClosetItem[];
  onItemClick: (item: ClosetItem) => void;
}

export const ClosetShelves: React.FC<ClosetShelvesProps> = ({ items, onItemClick }) => {
  return (
    <div className="relative w-full h-full">
      {/* Top Shelf */}
      <div className="absolute top-0 left-0 right-0 h-16">
        {/* Shelf surface */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-amber-600 to-amber-700 shadow-lg"></div>
        
        {/* Items on top shelf */}
        <div className="absolute bottom-3 left-2 right-2 flex justify-start items-end space-x-2 overflow-x-auto">
          {items.slice(0, 8).map((item, index) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-md cursor-pointer hover:scale-110 transition-transform duration-200 border border-purple-300"
              onClick={() => onItemClick(item)}
              title={`${item.brand} ${item.title}`}
              style={{
                backgroundColor: item.color === 'black' ? '#1f2937' :
                                item.color === 'white' ? '#f9fafb' :
                                item.color === 'red' ? '#ef4444' :
                                item.color === 'blue' ? '#3b82f6' :
                                item.color === 'brown' ? '#92400e' : '#8b5cf6'
              }}
            >
              {/* Item type indicator */}
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {item.category === 'bags' ? '👜' :
                 item.category === 'accessories' ? '🎀' : '💎'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Shelf */}
      <div className="absolute bottom-0 left-0 right-0 h-16">
        {/* Shelf surface */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-amber-600 to-amber-700 shadow-lg"></div>
        
        {/* Items on bottom shelf */}
        <div className="absolute bottom-3 left-2 right-2 flex justify-start items-end space-x-2 overflow-x-auto">
          {items.slice(8, 16).map((item, index) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg shadow-md cursor-pointer hover:scale-110 transition-transform duration-200 border border-pink-300"
              onClick={() => onItemClick(item)}
              title={`${item.brand} ${item.title}`}
              style={{
                backgroundColor: item.color === 'black' ? '#1f2937' :
                                item.color === 'white' ? '#f9fafb' :
                                item.color === 'red' ? '#ef4444' :
                                item.color === 'blue' ? '#3b82f6' :
                                item.color === 'brown' ? '#92400e' : '#ec4899'
              }}
            >
              {/* Item type indicator */}
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {item.category === 'bags' ? '👜' :
                 item.category === 'accessories' ? '🎀' : '💎'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shelf supports */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-amber-700 to-amber-800"></div>
      <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-amber-700 to-amber-800"></div>
    </div>
  );
};