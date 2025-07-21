package services

import (
	"digital-wardrobe-backend/internal/models"
	"digital-wardrobe-backend/pkg/logger"

	"gorm.io/gorm"
)

// UserService handles user operations
type UserService struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewUserService creates a new UserService
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		db:     db,
		logger: logger.New("user"),
	}
}

// GetUserByID gets a user by ID
func (s *UserService) GetUserByID(userID string) (*models.SafeUser, error) {
	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, err
	}
	return user.ToSafeUser(), nil
} 