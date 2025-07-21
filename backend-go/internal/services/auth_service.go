package services

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"digital-wardrobe-backend/internal/models"
	"digital-wardrobe-backend/pkg/logger"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/argon2"
	"gorm.io/gorm"
)

// AuthService handles authentication operations
type AuthService struct {
	db         *gorm.DB
	jwtSecret  string
	expiration time.Duration
	logger     logger.Logger
}

// NewAuthService creates a new AuthService
func NewAuthService(db *gorm.DB, jwtSecret string, expiration time.Duration) *AuthService {
	return &AuthService{
		db:         db,
		jwtSecret:  jwtSecret,
		expiration: expiration,
		logger:     logger.New("auth"),
	}
}

// RegisterCredentials represents registration data
type RegisterCredentials struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

// LoginCredentials represents login data
type LoginCredentials struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResult represents authentication result
type AuthResult struct {
	User  *models.SafeUser `json:"user"`
	Token string           `json:"token"`
}

// JWTClaims represents JWT claims
type JWTClaims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// Register registers a new user
func (s *AuthService) Register(creds RegisterCredentials) (*AuthResult, error) {
	// Check if user already exists
	var existingUser models.User
	if err := s.db.Where("email = ?", creds.Email).First(&existingUser).Error; err == nil {
		return nil, fmt.Errorf("user with email %s already exists", creds.Email)
	}

	// Hash password
	hashedPassword, err := s.hashPassword(creds.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := models.User{
		Email:        creds.Email,
		FirstName:    &creds.FirstName,
		LastName:     &creds.LastName,
		PasswordHash: &hashedPassword,
		DisplayName:  &creds.FirstName, // Default to first name
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT token
	token, err := s.generateToken(user.ID, user.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Create session
	if err := s.createSession(user.ID, token); err != nil {
		s.logger.Warnf("Failed to create session for user %s: %v", user.ID, err)
	}

	s.logger.Infof("User registered successfully: %s", user.Email)

	return &AuthResult{
		User:  user.ToSafeUser(),
		Token: token,
	}, nil
}

// Login authenticates a user
func (s *AuthService) Login(creds LoginCredentials) (*AuthResult, error) {
	var user models.User
	if err := s.db.Where("email = ?", creds.Email).First(&user).Error; err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Verify password
	if user.PasswordHash == nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	if !s.verifyPassword(creds.Password, *user.PasswordHash) {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Generate JWT token
	token, err := s.generateToken(user.ID, user.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Create session
	if err := s.createSession(user.ID, token); err != nil {
		s.logger.Warnf("Failed to create session for user %s: %v", user.ID, err)
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	s.db.Save(&user)

	s.logger.Infof("User logged in successfully: %s", user.Email)

	return &AuthResult{
		User:  user.ToSafeUser(),
		Token: token,
	}, nil
}

// ValidateToken validates a JWT token
func (s *AuthService) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		// Check if session exists
		var session models.Session
		if err := s.db.Where("token = ? AND is_active = ?", tokenString, true).First(&session).Error; err != nil {
			return nil, fmt.Errorf("session not found")
		}

		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// GetUserByID gets a user by ID
func (s *AuthService) GetUserByID(userID string) (*models.SafeUser, error) {
	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, fmt.Errorf("user not found")
	}

	return user.ToSafeUser(), nil
}

// hashPassword hashes a password using Argon2
func (s *AuthService) hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)

	// Combine salt and hash
	combined := make([]byte, 16+32)
	copy(combined[:16], salt)
	copy(combined[16:], hash)

	return base64.StdEncoding.EncodeToString(combined), nil
}

// verifyPassword verifies a password against a hash
func (s *AuthService) verifyPassword(password, hash string) bool {
	combined, err := base64.StdEncoding.DecodeString(hash)
	if err != nil {
		return false
	}

	if len(combined) != 48 {
		return false
	}

	salt := combined[:16]
	storedHash := combined[16:]

	computedHash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)

	// Constant time comparison
	if len(computedHash) != len(storedHash) {
		return false
	}

	for i := 0; i < len(computedHash); i++ {
		if computedHash[i] != storedHash[i] {
			return false
		}
	}

	return true
}

// generateToken generates a JWT token
func (s *AuthService) generateToken(userID, email string) (string, error) {
	claims := &JWTClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.expiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

// createSession creates a new session
func (s *AuthService) createSession(userID, token string) error {
	session := models.Session{
		UserID:    userID,
		Token:     token,
		ExpiresAt: time.Now().Add(s.expiration),
		IsActive:  true,
	}

	return s.db.Create(&session).Error
}
