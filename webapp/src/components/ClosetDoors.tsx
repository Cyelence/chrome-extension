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
        className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 border-r border-amber-900 transition-transform duration-1000 ease-in-out cursor-pointer ${
          isOpen ? '-translate-x-full rotate-y-90' : 'translate-x-0'
        }`}
        onClick={onToggle}
        style={{ 
          transformOrigin: 'left center',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Door Panel */}
        <div className="absolute inset-4 border-2 border-amber-800 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 shadow-inner">
          {/* Raised Panel */}
          <div className="absolute inset-4 border border-amber-700 rounded-md bg-gradient-to-br from-amber-500 to-amber-700 shadow-inner">
            {/* Wood grain */}
            <div className="absolute inset-0 rounded-md opacity-40" style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 3px,
                  rgba(139, 69, 19, 0.4) 3px,
                  rgba(139, 69, 19, 0.4) 6px
                )
              `
            }}></div>
          </div>
          
          {/* Inner decorative panel */}
          <div className="absolute inset-12 border border-amber-600 rounded-sm bg-gradient-to-br from-amber-400 to-amber-600 opacity-60"></div>
        </div>
        
        {/* Door Handle */}
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
          {/* Handle base */}
          <div className="w-3 h-12 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-lg border border-yellow-600">
            <div className="absolute inset-0.5 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full"></div>
            {/* Handle grip */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-700 rounded-full"></div>
          </div>
          {/* Handle shadow */}
          <div className="absolute top-1 left-1 w-3 h-12 bg-black opacity-20 rounded-full blur-sm"></div>
        </div>
        
        {/* Hinges */}
        <div className="absolute left-2 top-20 w-4 h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-sm shadow-md">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-800 rounded-full"></div>
        </div>
        <div className="absolute left-2 bottom-20 w-4 h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-sm shadow-md">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-800 rounded-full"></div>
        </div>
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-sm shadow-md">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-800 rounded-full"></div>
        </div>
      </div>

      {/* Right Door */}
      <div 
        className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-amber-600 via-amber-700 to-amber-800 border-l border-amber-900 transition-transform duration-1000 ease-in-out cursor-pointer ${
          isOpen ? 'translate-x-full -rotate-y-90' : 'translate-x-0'
        }`}
        onClick={onToggle}
        style={{ 
          transformOrigin: 'right center',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Door Panel */}
        <div className="absolute inset-4 border-2 border-amber-800 rounded-lg bg-gradient-to-bl from-amber-600 to-amber-800 shadow-inner">
          {/* Raised Panel */}
          <div className="absolute inset-4 border border-amber-700 rounded-md bg-gradient-to-bl from-amber-500 to-amber-700 shadow-inner">
            {/* Wood grain */}
            <div className="absolute inset-0 rounded-md opacity-40" style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 3px,
                  rgba(139, 69, 19, 0.4) 3px,
                  rgba(139, 69, 19, 0.4) 6px
                )
              `
            }}></div>
          </div>
          
          {/* Inner decorative panel */}
          <div className="absolute inset-12 border border-amber-600 rounded-sm bg-gradient-to-bl from-amber-400 to-amber-600 opacity-60"></div>
        </div>
        
        {/* Door Handle */}
        <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
          {/* Handle base */}
          <div className="w-3 h-12 bg-gradient-to-l from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-lg border border-yellow-600">
            <div className="absolute inset-0.5 bg-gradient-to-l from-yellow-300 to-yellow-400 rounded-full"></div>
            {/* Handle grip */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-700 rounded-full"></div>
          </div>
          {/* Handle shadow */}
          <div className="absolute top-1 right-1 w-3 h-12 bg-black opacity-20 rounded-full blur-sm"></div>
        </div>
        
        {/* Hinges */}
        <div className="absolute right-2 top-20 w-4 h-6 bg-gradient-to-l from-gray-600 to-gray-700 rounded-sm shadow-md">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-800 rounded-full"></div>
        </div>
        <div className="absolute right-2 bottom-20 w-4 h-6 bg-gradient-to-l from-gray-600 to-gray-700 rounded-sm shadow-md">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-800 rounded-full"></div>
        </div>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-6 bg-gradient-to-l from-gray-600 to-gray-700 rounded-sm shadow-md">
          <div className="absolute inset-0.5 bg-gray-500 rounded-sm"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-800 rounded-full"></div>
        </div>
      </div>

      {/* Door opening instruction */}
      {!isOpen && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black bg-opacity-70 text-white px-8 py-4 rounded-xl text-lg font-medium animate-pulse shadow-2xl backdrop-blur-sm border border-white border-opacity-20">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👆</span>
              <div>
                <div className="font-bold">Click to</div>
                <div className="text-yellow-300">👑 open your closet</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lock mechanism */}
      {!isOpen && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-12 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full shadow-lg border border-gray-300 z-10">
          <div className="absolute inset-0.5 bg-gray-300 rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gray-600 rounded-full"></div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gray-600 rounded-full"></div>
        </div>
      )}
    </>
  );
};