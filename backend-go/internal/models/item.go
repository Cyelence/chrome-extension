package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// StringSlice represents a slice of strings for JSON storage
type StringSlice []string

// Value implements the driver.Valuer interface
func (ss StringSlice) Value() (driver.Value, error) {
	return json.Marshal(ss)
}

// Scan implements the sql.Scanner interface
func (ss *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*ss = StringSlice{}
		return nil
	}
	
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, ss)
	case string:
		return json.Unmarshal([]byte(v), ss)
	default:
		return nil
	}
}

// Item represents a wardrobe item
type Item struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID      string    `json:"userId" gorm:"not null;index"`
	
	// Basic Info
	Name        string  `json:"name" gorm:"not null"`
	Brand       *string `json:"brand"`
	Description *string `json:"description"`
	Category    string  `json:"category" gorm:"not null;index"` // tops, bottoms, shoes, accessories, outerwear, dresses, other
	Subcategory *string `json:"subcategory"`
	
	// Product Details
	Price         *float64 `json:"price" gorm:"type:decimal(10,2)"`
	OriginalPrice *float64 `json:"originalPrice" gorm:"type:decimal(10,2)"`
	Currency      string   `json:"currency" gorm:"default:'USD'"`
	SKU           *string  `json:"sku"`
	Size          *string  `json:"size"`
	Color         *string  `json:"color"`
	Material      *string  `json:"material"`
	CareInstructions *string `json:"careInstructions"`
	
	// Purchase Info
	Status           string     `json:"status" gorm:"default:'want';index"` // want, purchased, owned, sold, donated
	PurchaseDate     *time.Time `json:"purchaseDate"`
	PurchaseLocation *string    `json:"purchaseLocation"`
	
	// Media
	Images       StringSlice `json:"images" gorm:"type:jsonb"` // Array of image URLs
	PrimaryImage *string     `json:"primaryImage"` // Main image URL
	
	// External Links
	OriginalURL  *string `json:"originalUrl"`
	AffiliateURL *string `json:"affiliateUrl"`
	
	// Organization
	Tags  StringSlice `json:"tags" gorm:"type:jsonb"`
	Notes *string     `json:"notes"`
	
	// Social Features
	IsPublic bool `json:"isPublic" gorm:"default:false;index"`
	Likes    int  `json:"likes" gorm:"default:0"`
	Views    int  `json:"views" gorm:"default:0"`
	
	// Metadata
	CreatedAt   time.Time  `json:"createdAt" gorm:"autoCreateTime;index"`
	UpdatedAt   time.Time  `json:"updatedAt" gorm:"autoUpdateTime"`
	ArchivedAt  *time.Time `json:"archivedAt"`
	
	// Relationships
	User            User             `json:"user,omitempty" gorm:"foreignKey:UserID"`
	CollectionItems []CollectionItem `json:"collectionItems,omitempty" gorm:"foreignKey:ItemID;constraint:OnDelete:CASCADE"`
	PriceAlerts     []PriceAlert     `json:"-" gorm:"foreignKey:ItemID;constraint:OnDelete:CASCADE"`
}

// TableName specifies the table name for Item
func (Item) TableName() string {
	return "items"
}

// BeforeCreate is called before creating an item
func (i *Item) BeforeCreate(tx *gorm.DB) error {
	if i.ID == "" {
		i.ID = generateItemUUID()
	}
	return nil
}

// generateItemUUID generates a UUID for items
func generateItemUUID() string {
	return "item_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}

// ItemWithRelations represents an item with its relationships
type ItemWithRelations struct {
	Item
	Collections []Collection `json:"collections,omitempty"`
}

// ItemData represents the data needed to create/update an item
type ItemData struct {
	Name        string      `json:"name" binding:"required"`
	Brand       *string     `json:"brand"`
	Description *string     `json:"description"`
	Category    string      `json:"category" binding:"required"`
	Subcategory *string     `json:"subcategory"`
	Price       *float64    `json:"price"`
	OriginalPrice *float64  `json:"originalPrice"`
	Currency    *string     `json:"currency"`
	SKU         *string     `json:"sku"`
	Size        *string     `json:"size"`
	Color       *string     `json:"color"`
	Material    *string     `json:"material"`
	CareInstructions *string `json:"careInstructions"`
	Status      *string     `json:"status"`
	PurchaseDate *time.Time `json:"purchaseDate"`
	PurchaseLocation *string `json:"purchaseLocation"`
	Images      StringSlice `json:"images"`
	PrimaryImage *string    `json:"primaryImage"`
	OriginalURL *string     `json:"originalUrl"`
	AffiliateURL *string    `json:"affiliateUrl"`
	Tags        StringSlice `json:"tags"`
	Notes       *string     `json:"notes"`
	IsPublic    *bool       `json:"isPublic"`
} 