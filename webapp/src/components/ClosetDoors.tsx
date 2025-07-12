import React from 'react';

interface ClosetDoorsProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ClosetDoors: React.FC<ClosetDoorsProps> = ({ isOpen, onToggle }) => {
  return (
    <>
      {/* Left Door */}
      <div 
        className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-amber-800 via-amber-700 to-amber-750 border-r-2 border-amber-600 transition-transform duration-700 ease-in-out cursor-pointer ${
          isOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
        onClick={onToggle}
        style={{ transformOrigin: 'left center' }}
      >
        {/* Door depth effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-800 opacity-30"></div>
        
        {/* Main door panel */}
        <div className="absolute inset-4 border-2 border-amber-600 rounded-lg bg-gradient-to-br from-amber-700 via-amber-750 to-amber-800 shadow-inner">
          <div className="absolute inset-2 border border-amber-500 rounded-md opacity-50"></div>
          
          {/* Wood grain effect */}
          <div className="absolute inset-0 opacity-20 rounded-lg" style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(139, 69, 19, 0.3) 2px,
                rgba(139, 69, 19, 0.3) 4px
              )
            `
          }}></div>
          
          {/* Decorative panel */}
          <div className="absolute inset-8 border border-amber-500 rounded-md bg-gradient-to-br from-amber-600 to-amber-700 opacity-60"></div>
        </div>
        
        {/* Enhanced door handle */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-10 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-lg border border-yellow-500">
          <div className="absolute inset-1 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-600 rounded-full"></div>
        </div>
        
        {/* Enhanced door hinges */}
        <div className="absolute left-1 top-16 w-3 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-sm shadow-md border border-gray-500">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
        </div>
        <div className="absolute left-1 bottom-16 w-3 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-sm shadow-md border border-gray-500">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
        </div>
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-3 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-sm shadow-md border border-gray-500">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
        </div>
      </div>

      {/* Right Door */}
      <div 
        className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-800 via-amber-700 to-amber-750 border-l-2 border-amber-600 transition-transform duration-700 ease-in-out cursor-pointer ${
          isOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
        onClick={onToggle}
        style={{ transformOrigin: 'right center' }}
      >
        {/* Door depth effect */}
        <div className="absolute inset-0 bg-gradient-to-bl from-amber-600 to-amber-800 opacity-30"></div>
        
        {/* Main door panel */}
        <div className="absolute inset-4 border-2 border-amber-600 rounded-lg bg-gradient-to-bl from-amber-700 via-amber-750 to-amber-800 shadow-inner">
          <div className="absolute inset-2 border border-amber-500 rounded-md opacity-50"></div>
          
          {/* Wood grain effect */}
          <div className="absolute inset-0 opacity-20 rounded-lg" style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(139, 69, 19, 0.3) 2px,
                rgba(139, 69, 19, 0.3) 4px
              )
            `
          }}></div>
          
          {/* Decorative panel */}
          <div className="absolute inset-8 border border-amber-500 rounded-md bg-gradient-to-bl from-amber-600 to-amber-700 opacity-60"></div>
        </div>
        
        {/* Enhanced door handle */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-10 bg-gradient-to-l from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-lg border border-yellow-500">
          <div className="absolute inset-1 bg-gradient-to-l from-yellow-300 to-yellow-400 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-600 rounded-full"></div>
        </div>
        
        {/* Enhanced door hinges */}
        <div className="absolute right-1 top-16 w-3 h-8 bg-gradient-to-l from-gray-600 to-gray-700 rounded-sm shadow-md border border-gray-500">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
        </div>
        <div className="absolute right-1 bottom-16 w-3 h-8 bg-gradient-to-l from-gray-600 to-gray-700 rounded-sm shadow-md border border-gray-500">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
        </div>
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-8 bg-gradient-to-l from-gray-600 to-gray-700 rounded-sm shadow-md border border-gray-500">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
        </div>
      </div>

      {/* Enhanced door opening instruction */}
      {!isClosetOpen && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black bg-opacity-60 text-white px-6 py-3 rounded-xl text-sm font-medium animate-pulse shadow-lg backdrop-blur-sm border border-white border-opacity-20">
            <div className="flex items-center space-x-2">
              <span>👆</span>
              <span>Click to open your closet</span>
            </div>
          </div>
        </div>
      )}

      {/* Door lock mechanism (decorative) */}
      {!isOpen && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-8 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full shadow-md border border-gray-300 pointer-events-none"></div>
      )}
    </>
  );
};