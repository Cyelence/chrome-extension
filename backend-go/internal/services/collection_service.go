package services

import (
	"digital-wardrobe-backend/internal/models"
	"digital-wardrobe-backend/pkg/logger"

	"gorm.io/gorm"
)

// CollectionService handles collection operations
type CollectionService struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewCollectionService creates a new CollectionService
func NewCollectionService(db *gorm.DB) *CollectionService {
	return &CollectionService{
		db:     db,
		logger: logger.New("collection"),
	}
}

// GetCollections gets collections for a user
func (s *CollectionService) GetCollections(userID string) ([]models.Collection, error) {
	var collections []models.Collection
	err := s.db.Where("user_id = ?", userID).Find(&collections).Error
	return collections, err
} 