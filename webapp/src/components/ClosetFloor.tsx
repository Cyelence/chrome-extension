import React from 'react';
import { ClosetItem } from '../types';

interface ClosetFloorProps {
  items: ClosetItem[];
  onItemClick: (item: ClosetItem) => void;
}

export const ClosetFloor: React.FC<ClosetFloorProps> = ({ items, onItemClick }) => {
  const renderShoe = (item: ClosetItem, index: number) => {
    const getShoeColor = (color: string) => {
      const colorMap: { [key: string]: string } = {
        'black': '#1f2937',
        'white': '#f9fafb',
        'brown': '#92400e',
        'red': '#ef4444',
        'blue': '#3b82f6',
        'navy': '#1e3a8a',
        'tan': '#d2b48c',
        'gray': '#6b7280',
      };
      return colorMap[color.toLowerCase()] || '#6b7280';
    };

    return (
      <div
        key={item.id}
        className="flex-shrink-0 relative cursor-pointer hover:scale-105 transition-transform duration-200"
        onClick={() => onItemClick(item)}
        title={`${item.brand} ${item.title}`}
      >
        {/* Shoe pair */}
        <div className="flex space-x-1">
          {/* Left shoe */}
          <div 
            className="w-8 h-4 rounded-l-full rounded-r-lg shadow-md border border-gray-300"
            style={{ backgroundColor: getShoeColor(item.color) }}
          >
            {/* Shoe sole */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-l-full rounded-r-lg opacity-60"></div>
            {/* Shoe laces/details */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-white bg-opacity-50 rounded-full"></div>
          </div>
          
          {/* Right shoe */}
          <div 
            className="w-8 h-4 rounded-r-full rounded-l-lg shadow-md border border-gray-300"
            style={{ backgroundColor: getShoeColor(item.color) }}
          >
            {/* Shoe sole */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-r-full rounded-l-lg opacity-60"></div>
            {/* Shoe laces/details */}
            <div className="absolute top-1 right-1 w-1 h-1 bg-white bg-opacity-50 rounded-full"></div>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white shadow-sm ${
          item.status === 'owned' ? 'bg-green-500' :
          item.status === 'purchased' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
      </div>
    );
  };

  const renderBottoms = (item: ClosetItem, index: number) => {
    const getBottomsColor = (color: string) => {
      const colorMap: { [key: string]: string } = {
        'black': '#1f2937',
        'blue': '#3b82f6',
        'navy': '#1e3a8a',
        'white': '#f9fafb',
        'gray': '#6b7280',
        'brown': '#92400e',
        'khaki': '#d2b48c',
      };
      return colorMap[color.toLowerCase()] || '#6b7280';
    };

    return (
      <div
        key={item.id}
        className="flex-shrink-0 relative cursor-pointer hover:scale-105 transition-transform duration-200"
        onClick={() => onItemClick(item)}
        title={`${item.brand} ${item.title}`}
      >
        {/* Folded pants/bottoms */}
        <div 
          className="w-12 h-8 rounded-lg shadow-md border border-gray-300 relative"
          style={{ backgroundColor: getBottomsColor(item.color) }}
        >
          {/* Fold lines */}
          <div className="absolute top-2 left-1 right-1 h-px bg-black bg-opacity-20"></div>
          <div className="absolute top-4 left-1 right-1 h-px bg-black bg-opacity-20"></div>
          <div className="absolute top-6 left-1 right-1 h-px bg-black bg-opacity-20"></div>
          
          {/* Waistband */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-black bg-opacity-30 rounded-t-lg"></div>
        </div>

        {/* Status indicator */}
        <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white shadow-sm ${
          item.status === 'owned' ? 'bg-green-500' :
          item.status === 'purchased' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
      </div>
    );
  };

  const shoeItems = items.filter(item => item.category === 'shoes');
  const bottomItems = items.filter(item => item.category === 'bottoms');

  return (
    <div className="relative w-full h-full">
      {/* Floor surface */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-amber-700 to-amber-800 shadow-lg"></div>
      
      {/* Floor items */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-start items-end space-x-3 overflow-x-auto">
        {/* Shoes section */}
        <div className="flex space-x-2">
          {shoeItems.slice(0, 6).map((item, index) => renderShoe(item, index))}
        </div>
        
        {/* Separator */}
        {shoeItems.length > 0 && bottomItems.length > 0 && (
          <div className="w-px h-6 bg-amber-600 opacity-50"></div>
        )}
        
        {/* Bottoms section */}
        <div className="flex space-x-2">
          {bottomItems.slice(0, 4).map((item, index) => renderBottoms(item, index))}
        </div>
      </div>

      {/* Floor texture */}
      <div className="absolute bottom-0 left-0 right-0 h-2 opacity-30" style={{
        backgroundImage: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 2px,
          rgba(139, 69, 19, 0.2) 2px,
          rgba(139, 69, 19, 0.2) 4px
        )`
      }}></div>
    </div>
  );
};