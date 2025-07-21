package models

import (
	"time"

	"gorm.io/gorm"
)

// AppConfig represents application configuration
type AppConfig struct {
	ID          string  `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Key         string  `json:"key" gorm:"uniqueIndex;not null"`
	Value       string  `json:"value" gorm:"not null"`
	Description *string `json:"description"`

	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for AppConfig
func (AppConfig) TableName() string {
	return "app_config"
}

// BeforeCreate is called before creating app config
func (ac *AppConfig) BeforeCreate(tx *gorm.DB) error {
	if ac.ID == "" {
		ac.ID = generateAppConfigUUID()
	}
	return nil
}

// generateAppConfigUUID generates a UUID for app config
func generateAppConfigUUID() string {
	return "app_config_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}

// AuditLog represents system audit logs
type AuditLog struct {
	ID           string  `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       *string `json:"userId" gorm:"index"`
	Action       string  `json:"action" gorm:"not null;index"`
	ResourceType string  `json:"resourceType" gorm:"not null;index"`
	ResourceID   *string `json:"resourceId" gorm:"index"`
	Details      JSONMap `json:"details" gorm:"type:jsonb"`
	IPAddress    *string `json:"ipAddress"`
	UserAgent    *string `json:"userAgent"`

	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime;index"`

	// Relationships
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName specifies the table name for AuditLog
func (AuditLog) TableName() string {
	return "audit_logs"
}

// BeforeCreate is called before creating audit log
func (al *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if al.ID == "" {
		al.ID = generateAuditLogUUID()
	}
	return nil
}

// generateAuditLogUUID generates a UUID for audit logs
func generateAuditLogUUID() string {
	return "audit_log_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}
