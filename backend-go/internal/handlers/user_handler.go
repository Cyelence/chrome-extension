package handlers

import (
	"net/http"

	"digital-wardrobe-backend/internal/services"

	"github.com/gin-gonic/gin"
)

// UserHandler handles user requests
type UserHandler struct {
	userService *services.UserService
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetProfile gets the current user's profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get profile - not implemented"})
}

// UpdateProfile updates the current user's profile
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update profile - not implemented"})
}

// DeleteAccount deletes the current user's account
func (h *UserHandler) DeleteAccount(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Delete account - not implemented"})
} 