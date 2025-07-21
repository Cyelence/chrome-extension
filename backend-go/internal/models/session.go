package models

import (
	"time"

	"gorm.io/gorm"
)

// Session represents a user session
type Session struct {
	ID           string    `json:"id" gorm:"primaryKey;type:text"`
	UserID       string    `json:"userId" gorm:"index;type:text"`
	Token        string    `json:"token" gorm:"uniqueIndex;not null;type:text"`
	RefreshToken *string   `json:"refreshToken" gorm:"uniqueIndex;type:text"`
	ExpiresAt    time.Time `json:"expiresAt" gorm:"not null;index"`
	DeviceInfo   *string   `json:"deviceInfo"`
	IPAddress    *string   `json:"ipAddress"`
	UserAgent    *string   `json:"userAgent"`
	IsActive     bool      `json:"isActive" gorm:"default:true"`
	CreatedAt    time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updatedAt" gorm:"autoUpdateTime"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName specifies the table name for Session
func (Session) TableName() string {
	return "sessions"
}

// BeforeCreate is called before creating a session
func (s *Session) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = generateSessionUUID()
	}
	return nil
}

// generateSessionUUID generates a UUID for sessions
func generateSessionUUID() string {
	return "session_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}
