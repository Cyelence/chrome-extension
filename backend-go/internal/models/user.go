package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Email       string    `json:"email" gorm:"uniqueIndex;not null"`
	Username    *string   `json:"username" gorm:"uniqueIndex"`
	FirstName   *string   `json:"firstName"`
	LastName    *string   `json:"lastName"`
	DisplayName *string   `json:"displayName"`
	Avatar      *string   `json:"avatar"`
	
	// Authentication
	PasswordHash            *string   `json:"-" gorm:"column:password_hash"`
	IsEmailVerified        bool      `json:"isEmailVerified" gorm:"default:false"`
	EmailVerificationToken *string   `json:"-"`
	EmailVerificationExpires *time.Time `json:"-"`
	
	// Password Reset
	PasswordResetToken     *string   `json:"-"`
	PasswordResetExpires   *time.Time `json:"-"`
	
	// OAuth
	GoogleID   *string `json:"-"`
	FacebookID *string `json:"-"`
	AppleID    *string `json:"-"`
	
	// Profile
	Bio       *string    `json:"bio"`
	BirthDate *time.Time `json:"birthDate"`
	Gender    *string    `json:"gender"`
	Location  *string    `json:"location"`
	Website   *string    `json:"website"`
	
	// Privacy & Preferences
	IsPrivate           bool `json:"isPrivate" gorm:"default:false"`
	AllowAnalytics      bool `json:"allowAnalytics" gorm:"default:true"`
	EmailNotifications  bool `json:"emailNotifications" gorm:"default:true"`
	PushNotifications   bool `json:"pushNotifications" gorm:"default:true"`
	
	// Subscription & Features
	SubscriptionTier    string     `json:"subscriptionTier" gorm:"default:'free'"`
	SubscriptionExpires *time.Time `json:"subscriptionExpires"`
	
	// Metadata
	CreatedAt   time.Time  `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `json:"updatedAt" gorm:"autoUpdateTime"`
	LastLoginAt *time.Time `json:"lastLoginAt"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	
	// Relationships
	Items       []Item       `json:"items,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Collections []Collection `json:"collections,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Sessions    []Session    `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	PriceAlerts []PriceAlert `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Analytics   *UserAnalytics `json:"analytics,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	
	// Social relationships
	Follows    []Follow `json:"-" gorm:"foreignKey:FollowerID;constraint:OnDelete:CASCADE"`
	Followers  []Follow `json:"-" gorm:"foreignKey:FollowingID;constraint:OnDelete:CASCADE"`
}

// TableName specifies the table name for User
func (User) TableName() string {
	return "users"
}

// SafeUser represents a user without sensitive information
type SafeUser struct {
	ID          string     `json:"id"`
	Email       string     `json:"email"`
	Username    *string    `json:"username"`
	FirstName   *string    `json:"firstName"`
	LastName    *string    `json:"lastName"`
	DisplayName *string    `json:"displayName"`
	Avatar      *string    `json:"avatar"`
	Bio         *string    `json:"bio"`
	Location    *string    `json:"location"`
	Website     *string    `json:"website"`
	IsPrivate   bool       `json:"isPrivate"`
	SubscriptionTier string `json:"subscriptionTier"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	LastLoginAt *time.Time `json:"lastLoginAt"`
	IsActive    bool       `json:"isActive"`
}

// ToSafeUser converts a User to SafeUser
func (u *User) ToSafeUser() *SafeUser {
	return &SafeUser{
		ID:              u.ID,
		Email:           u.Email,
		Username:        u.Username,
		FirstName:       u.FirstName,
		LastName:        u.LastName,
		DisplayName:     u.DisplayName,
		Avatar:          u.Avatar,
		Bio:             u.Bio,
		Location:        u.Location,
		Website:         u.Website,
		IsPrivate:       u.IsPrivate,
		SubscriptionTier: u.SubscriptionTier,
		CreatedAt:       u.CreatedAt,
		UpdatedAt:       u.UpdatedAt,
		LastLoginAt:     u.LastLoginAt,
		IsActive:        u.IsActive,
	}
}

// BeforeCreate is called before creating a user
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = generateUUID()
	}
	return nil
}

// generateUUID generates a UUID (simplified for now)
func generateUUID() string {
	return "user_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}

// randomString generates a random string
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
} 