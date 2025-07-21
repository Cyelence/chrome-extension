package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"digital-wardrobe-backend/internal/config"
	"digital-wardrobe-backend/internal/database"
	"digital-wardrobe-backend/internal/middleware"
	"digital-wardrobe-backend/internal/routes"
	"digital-wardrobe-backend/internal/services"
	"digital-wardrobe-backend/pkg/logger"

	"github.com/gin-gonic/gin"
)

// @title Digital Wardrobe API
// @version 1.0
// @description Premium backend service for Digital Wardrobe Chrome Extension
// @host localhost:8080
// @BasePath /api/v1
func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize logger
	logger := logger.New(cfg.LogLevel)

	// Initialize database
	db, err := database.New(cfg.Database.URL)
	if err != nil {
		logger.Fatalf("Failed to connect to database: %v", err)
	}
	defer func() {
		sqlDB, err := db.DB()
		if err != nil {
			logger.Errorf("Failed to get database instance: %v", err)
			return
		}
		if err := sqlDB.Close(); err != nil {
			logger.Errorf("Failed to close database: %v", err)
		}
	}()

	// Initialize Redis (optional)
	var redisClient *services.RedisClient
	if cfg.Redis.URL != "" {
		redisClient, err = services.NewRedisClient(cfg.Redis.URL)
		if err != nil {
			logger.Warnf("Failed to connect to Redis: %v", err)
		} else {
			defer redisClient.Close()
		}
	}

	// Initialize services
	authService := services.NewAuthService(db, cfg.JWT.Secret, cfg.JWT.Expiration)
	userService := services.NewUserService(db)
	itemService := services.NewItemService(db)
	collectionService := services.NewCollectionService(db)
	analyticsService := services.NewAnalyticsService(db)

	// Initialize handlers
	handlers := routes.New(
		authService,
		userService,
		itemService,
		collectionService,
		analyticsService,
		redisClient,
	)

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode)
	if cfg.Environment == "development" {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.New()

	// Global middleware
	router.Use(middleware.Logger(logger))
	router.Use(middleware.Recovery(logger))
	router.Use(middleware.CORS(cfg.CORS.Origins))
	router.Use(middleware.Compression())
	router.Use(middleware.RequestID())
	router.Use(middleware.Timeout(30 * time.Second))

	// Setup routes
	routes.Setup(router, handlers, cfg.API.Prefix)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"service":   "Digital Wardrobe API",
			"version":   "1.0.0",
		})
	})

	// Create HTTP server
	srv := &http.Server{
		Addr:    cfg.Server.Address,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		logger.Infof("🚀 Starting Digital Wardrobe API server on %s", cfg.Server.Address)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("🛑 Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Errorf("Server forced to shutdown: %v", err)
	}

	logger.Info("✅ Server exited")
}
