import React, { useState } from 'react';
import { useApp, useAppActions } from '../contexts/AppContext';
import { X, Upload, Link, Camera } from 'lucide-react';
import { ClosetItem, ItemCategory, ItemStatus } from '../types';

export const AddItemModal: React.FC = () => {
  const { state } = useApp();
  const { addItem, toggleModal } = useAppActions();
  
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    price: '',
    category: 'tops' as ItemCategory,
    status: 'want' as ItemStatus,
    color: '',
    size: '',
    imageUrl: '',
    originalLink: '',
    notes: '',
    tags: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newItem: ClosetItem = {
      id: Date.now().toString(),
      title: formData.title,
      brand: formData.brand,
      price: parseFloat(formData.price) || 0,
      category: formData.category,
      status: formData.status,
      color: formData.color,
      size: formData.size,
      imageUrl: formData.imageUrl,
      originalLink: formData.originalLink,
      notes: formData.notes,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      dateAdded: new Date(),
      dateUpdated: new Date(),
      isFavorite: false,
      isOnSale: false,
      priceDropNotification: false,
      collections: [],
      likes: 0,
      shares: 0,
      saves: 0,
      isPublic: false,
    };

    addItem(newItem);
    toggleModal('addItem', false);
    
    // Reset form
    setFormData({
      title: '',
      brand: '',
      price: '',
      category: 'tops',
      status: 'want',
      color: '',
      size: '',
      imageUrl: '',
      originalLink: '',
      notes: '',
      tags: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Item</h2>
          <button
            onClick={() => toggleModal('addItem', false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Classic White Button Shirt"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Everlane"
              />
            </div>
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="tops">👔 Tops</option>
                <option value="bottoms">👖 Bottoms</option>
                <option value="dresses">👗 Dresses</option>
                <option value="outerwear">🧥 Outerwear</option>
                <option value="shoes">👠 Shoes</option>
                <option value="accessories">👜 Accessories</option>
                <option value="bags">👜 Bags</option>
                <option value="jewelry">💎 Jewelry</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="want">❤️ Want to Buy</option>
                <option value="purchased">🛒 Just Purchased</option>
                <option value="owned">✅ Own It</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Navy Blue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., M, 8, 32"
              />
            </div>
          </div>

          {/* Image and Link */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Upload image"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Link
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  name="originalLink"
                  value={formData.originalLink}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="https://store.com/product"
                />
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Paste from clipboard"
                >
                  <Link className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notes and Tags */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Add any notes about this item..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., professional, versatile, cotton (comma separated)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => toggleModal('addItem', false)}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              Add to Closet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};