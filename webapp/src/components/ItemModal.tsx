import React from 'react';
import { ClosetItem } from '../types';
import { X, ExternalLink, Heart, Edit, Trash2 } from 'lucide-react';

interface ItemModalProps {
  item: ClosetItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ item, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'owned': return 'bg-green-100 text-green-800 border-green-200';
      case 'purchased': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'want': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      'tops': '👔',
      'bottoms': '👖',
      'dresses': '👗',
      'outerwear': '🧥',
      'shoes': '👠',
      'accessories': '👜',
      'bags': '👜',
      'jewelry': '💎',
    };
    return emojis[category] || '👕';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Item Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {getCategoryEmoji(item.category)}
                  </div>
                )}
              </div>
              
              {/* Quick Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button className="flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center px-4 py-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
                  <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(item.status)}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                  {item.isFavorite && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium border border-yellow-200">
                      ⭐ Favorite
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Brand</label>
                  <p className="text-gray-900">{item.brand || 'Not specified'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Price</label>
                  <p className="text-gray-900">
                    ${item.price}
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="ml-2 text-gray-500 line-through">${item.originalPrice}</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Category</label>
                  <p className="text-gray-900">{getCategoryEmoji(item.category)} {item.category}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Color</label>
                  <p className="text-gray-900">{item.color || 'Not specified'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Size</label>
                  <p className="text-gray-900">{item.size || 'Not specified'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Date Added</label>
                  <p className="text-gray-900">{new Date(item.dateAdded).toLocaleDateString()}</p>
                </div>
              </div>

              {item.notes && (
                <div>
                  <label className="font-medium text-gray-700">Notes</label>
                  <p className="text-gray-900 mt-1">{item.notes}</p>
                </div>
              )}

              {item.tags && item.tags.length > 0 && (
                <div>
                  <label className="font-medium text-gray-700">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.originalLink && (
                <div>
                  <a
                    href={item.originalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Original</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};