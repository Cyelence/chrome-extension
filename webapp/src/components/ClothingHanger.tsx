import React from 'react';
import { ClosetItem } from '../types';

interface ClothingHangerProps {
  item: ClosetItem;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const ClothingHanger: React.FC<ClothingHangerProps> = ({ item, onClick, style }) => {
  const getClothingColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'black': 'bg-gray-900',
      'white': 'bg-gray-100',
      'red': 'bg-red-500',
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'yellow': 'bg-yellow-400',
      'pink': 'bg-pink-400',
      'purple': 'bg-purple-500',
      'brown': 'bg-amber-700',
      'gray': 'bg-gray-500',
      'navy': 'bg-blue-900',
      'beige': 'bg-amber-200',
    };
    
    return colorMap[color.toLowerCase()] || 'bg-gray-400';
  };

  const getClothingShape = (category: string) => {
    switch (category) {
      case 'dresses':
        return 'dress';
      case 'outerwear':
        return 'jacket';
      default:
        return 'shirt';
    }
  };

  const renderClothing = () => {
    const colorClass = getClothingColor(item.color);
    const shape = getClothingShape(item.category);

    switch (shape) {
      case 'dress':
        return (
          <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 w-10 h-28 ${colorClass} rounded-t-lg shadow-md`}>
            {/* Dress silhouette */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-inherit rounded-t-lg"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-16 bg-inherit rounded-b-full"></div>
            {/* Dress details */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-black bg-opacity-20 rounded"></div>
          </div>
        );
      
      case 'jacket':
        return (
          <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 w-11 h-20 ${colorClass} rounded-lg shadow-md`}>
            {/* Jacket silhouette */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-9 h-16 bg-inherit rounded-lg"></div>
            {/* Jacket lapels */}
            <div className="absolute top-1 left-1 w-2 h-4 bg-black bg-opacity-20 rounded-tl-lg"></div>
            <div className="absolute top-1 right-1 w-2 h-4 bg-black bg-opacity-20 rounded-tr-lg"></div>
            {/* Buttons */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="absolute top-9 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-600 rounded-full"></div>
          </div>
        );
      
      default: // shirt
        return (
          <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 w-10 h-16 ${colorClass} rounded-lg shadow-md`}>
            {/* Shirt silhouette */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-14 bg-inherit rounded-lg"></div>
            {/* Sleeves */}
            <div className="absolute top-1 -left-1 w-3 h-6 bg-inherit rounded-l-lg"></div>
            <div className="absolute top-1 -right-1 w-3 h-6 bg-inherit rounded-r-lg"></div>
            {/* Collar */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black bg-opacity-20 rounded-t-lg"></div>
          </div>
        );
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-12 h-36 relative cursor-pointer hover:scale-105 transition-transform duration-200"
      onClick={onClick}
      style={style}
      title={`${item.brand} ${item.title}`}
    >
      {/* Hanger */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-400 rounded-full shadow-sm"></div>
      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-6 border-2 border-gray-400 rounded-t-full bg-gray-300"></div>
      
      {/* Hanger hook */}
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gray-500 rounded-full"></div>

      {/* Clothing */}
      {renderClothing()}

      {/* Status indicator */}
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
        item.status === 'owned' ? 'bg-green-500' :
        item.status === 'purchased' ? 'bg-yellow-500' : 'bg-red-500'
      }`}></div>

      {/* Favorite indicator */}
      {item.isFavorite && (
        <div className="absolute -top-1 -left-1 w-3 h-3 text-yellow-400 text-xs">
          ⭐
        </div>
      )}
    </div>
  );
};