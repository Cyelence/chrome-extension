package services

import (
	"digital-wardrobe-backend/internal/models"
	"digital-wardrobe-backend/pkg/logger"

	"gorm.io/gorm"
)

// AnalyticsService handles analytics operations
type AnalyticsService struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewAnalyticsService creates a new AnalyticsService
func NewAnalyticsService(db *gorm.DB) *AnalyticsService {
	return &AnalyticsService{
		db:     db,
		logger: logger.New("analytics"),
	}
}

// GetOverview gets analytics overview for a user
func (s *AnalyticsService) GetOverview(userID string) (*models.UserAnalytics, error) {
	var analytics models.UserAnalytics
	err := s.db.Where("user_id = ?", userID).First(&analytics).Error
	return &analytics, err
} 