package services

import (
	"digital-wardrobe-backend/internal/models"
	"digital-wardrobe-backend/pkg/logger"

	"gorm.io/gorm"
)

// ItemService handles item operations
type ItemService struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewItemService creates a new ItemService
func NewItemService(db *gorm.DB) *ItemService {
	return &ItemService{
		db:     db,
		logger: logger.New("item"),
	}
}

// GetItems gets items for a user
func (s *ItemService) GetItems(userID string) ([]models.Item, error) {
	var items []models.Item
	err := s.db.Where("user_id = ?", userID).Find(&items).Error
	return items, err
} 