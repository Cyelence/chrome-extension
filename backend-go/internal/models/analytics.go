package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// JSONMap represents a JSON object for storage
type JSONMap map[string]interface{}

// Value implements the driver.Valuer interface
func (jm JSONMap) Value() (driver.Value, error) {
	return json.Marshal(jm)
}

// Scan implements the sql.Scanner interface
func (jm *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*jm = JSONMap{}
		return nil
	}
	
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, jm)
	case string:
		return json.Unmarshal([]byte(v), jm)
	default:
		return nil
	}
}

// UserAnalytics represents user analytics data
type UserAnalytics struct {
	ID string `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID string `json:"userId" gorm:"uniqueIndex;not null"`
	
	// Item Statistics
	TotalItems int     `json:"totalItems" gorm:"default:0"`
	TotalValue float64 `json:"totalValue" gorm:"type:decimal(10,2);default:0"`
	TotalSpent float64 `json:"totalSpent" gorm:"type:decimal(10,2);default:0"`
	AverageItemPrice float64 `json:"averageItemPrice" gorm:"type:decimal(10,2);default:0"`
	
	// Category Breakdown
	CategoryBreakdown JSONMap `json:"categoryBreakdown" gorm:"type:jsonb"` // {tops: 10, bottoms: 5, etc.}
	BrandBreakdown    JSONMap `json:"brandBreakdown" gorm:"type:jsonb"`    // {nike: 5, adidas: 3, etc.}
	ColorBreakdown    JSONMap `json:"colorBreakdown" gorm:"type:jsonb"`    // {black: 8, white: 6, etc.}
	
	// Shopping Patterns
	MostActiveMonth string  `json:"mostActiveMonth"`
	PreferredBrands StringSlice `json:"preferredBrands" gorm:"type:jsonb"`
	AverageMonthlySpending float64 `json:"averageMonthlySpending" gorm:"type:decimal(10,2);default:0"`
	
	// Engagement
	TotalLogins int `json:"totalLogins" gorm:"default:0"`
	Streak int `json:"streak" gorm:"default:0"` // Days of consecutive usage
	LongestStreak int `json:"longestStreak" gorm:"default:0"`
	
	// Metadata
	LastCalculatedAt time.Time `json:"lastCalculatedAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
	
	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName specifies the table name for UserAnalytics
func (UserAnalytics) TableName() string {
	return "user_analytics"
}

// BeforeCreate is called before creating user analytics
func (ua *UserAnalytics) BeforeCreate(tx *gorm.DB) error {
	if ua.ID == "" {
		ua.ID = generateAnalyticsUUID()
	}
	return nil
}

// generateAnalyticsUUID generates a UUID for analytics
func generateAnalyticsUUID() string {
	return "analytics_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}

// Follow represents social following relationships
type Follow struct {
	ID string `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	FollowerID string `json:"followerId" gorm:"not null;index"`
	FollowingID string `json:"followingId" gorm:"not null;index"`
	
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	
	// Relationships
	Follower User `json:"follower,omitempty" gorm:"foreignKey:FollowerID"`
	Following User `json:"following,omitempty" gorm:"foreignKey:FollowingID"`
}

// TableName specifies the table name for Follow
func (Follow) TableName() string {
	return "follows"
}

// BeforeCreate is called before creating a follow
func (f *Follow) BeforeCreate(tx *gorm.DB) error {
	if f.ID == "" {
		f.ID = generateFollowUUID()
	}
	return nil
}

// generateFollowUUID generates a UUID for follows
func generateFollowUUID() string {
	return "follow_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}

// PriceAlert represents price tracking alerts
type PriceAlert struct {
	ID string `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID string `json:"userId" gorm:"not null;index"`
	ItemID *string `json:"itemId" gorm:"index"`
	
	// Alert Configuration
	ProductURL string  `json:"productUrl" gorm:"not null"`
	TargetPrice float64 `json:"targetPrice" gorm:"type:decimal(10,2);not null"`
	CurrentPrice *float64 `json:"currentPrice" gorm:"type:decimal(10,2)"`
	Currency string `json:"currency" gorm:"default:'USD'"`
	
	// Alert Status
	IsActive bool `json:"isActive" gorm:"default:true;index"`
	IsTriggered bool `json:"isTriggered" gorm:"default:false"`
	TriggeredAt *time.Time `json:"triggeredAt"`
	
	// Notification Settings
	EmailNotification bool `json:"emailNotification" gorm:"default:true"`
	PushNotification bool `json:"pushNotification" gorm:"default:true"`
	
	// Metadata
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
	LastCheckedAt *time.Time `json:"lastCheckedAt"`
	
	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Item *Item `json:"item,omitempty" gorm:"foreignKey:ItemID"`
}

// TableName specifies the table name for PriceAlert
func (PriceAlert) TableName() string {
	return "price_alerts"
}

// BeforeCreate is called before creating a price alert
func (pa *PriceAlert) BeforeCreate(tx *gorm.DB) error {
	if pa.ID == "" {
		pa.ID = generatePriceAlertUUID()
	}
	return nil
}

// generatePriceAlertUUID generates a UUID for price alerts
func generatePriceAlertUUID() string {
	return "price_alert_" + time.Now().Format("20060102150405") + "_" + randomString(8)
} 