package models

import (
	"time"

	"gorm.io/gorm"
)

// Collection represents a collection of items
type Collection struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID      string    `json:"userId" gorm:"not null;index"`
	Name        string    `json:"name" gorm:"not null"`
	Description *string   `json:"description"`
	Color       *string   `json:"color"` // For UI theming
	Icon        *string   `json:"icon"`  // Icon identifier
	
	// Privacy
	IsPublic bool `json:"isPublic" gorm:"default:false;index"`
	
	// Metadata
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime;index"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
	
	// Relationships
	User  User             `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Items []CollectionItem `json:"items,omitempty" gorm:"foreignKey:CollectionID;constraint:OnDelete:CASCADE"`
}

// TableName specifies the table name for Collection
func (Collection) TableName() string {
	return "collections"
}

// BeforeCreate is called before creating a collection
func (c *Collection) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = generateCollectionUUID()
	}
	return nil
}

// generateCollectionUUID generates a UUID for collections
func generateCollectionUUID() string {
	return "collection_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}

// CollectionItem represents the many-to-many relationship between collections and items
type CollectionItem struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	CollectionID string    `json:"collectionId" gorm:"not null;index"`
	ItemID       string    `json:"itemId" gorm:"not null;index"`
	
	// Custom order within collection
	Order int `json:"order" gorm:"default:0"`
	
	// Custom notes for this item in this collection
	Notes *string `json:"notes"`
	
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	
	// Relationships
	Collection Collection `json:"collection,omitempty" gorm:"foreignKey:CollectionID"`
	Item       Item       `json:"item,omitempty" gorm:"foreignKey:ItemID"`
}

// TableName specifies the table name for CollectionItem
func (CollectionItem) TableName() string {
	return "collection_items"
}

// BeforeCreate is called before creating a collection item
func (ci *CollectionItem) BeforeCreate(tx *gorm.DB) error {
	if ci.ID == "" {
		ci.ID = generateCollectionItemUUID()
	}
	return nil
}

// generateCollectionItemUUID generates a UUID for collection items
func generateCollectionItemUUID() string {
	return "collection_item_" + time.Now().Format("20060102150405") + "_" + randomString(8)
} 