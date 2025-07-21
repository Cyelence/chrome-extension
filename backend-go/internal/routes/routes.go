package routes

import (
	"digital-wardrobe-backend/internal/handlers"
	"digital-wardrobe-backend/internal/middleware"
	"digital-wardrobe-backend/internal/services"

	"github.com/gin-gonic/gin"
)

// Handlers holds all handlers
type Handlers struct {
	Auth        *handlers.AuthHandler
	User        *handlers.UserHandler
	Item        *handlers.ItemHandler
	Collection  *handlers.CollectionHandler
	Analytics   *handlers.AnalyticsHandler
	AuthService *services.AuthService
}

// New creates new handlers
func New(
	authService *services.AuthService,
	userService *services.UserService,
	itemService *services.ItemService,
	collectionService *services.CollectionService,
	analyticsService *services.AnalyticsService,
	redisClient *services.RedisClient,
) *Handlers {
	return &Handlers{
		Auth:        handlers.NewAuthHandler(authService),
		User:        handlers.NewUserHandler(userService),
		Item:        handlers.NewItemHandler(itemService),
		Collection:  handlers.NewCollectionHandler(collectionService),
		Analytics:   handlers.NewAnalyticsHandler(analyticsService),
		AuthService: authService, // Keep reference for middleware
	}
}

// Setup sets up all routes
func Setup(router *gin.Engine, handlers *Handlers, apiPrefix string) {
	// API v1 group
	v1 := router.Group(apiPrefix)
	{
		// Auth routes (no auth required)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Auth.Register)
			auth.POST("/login", handlers.Auth.Login)
			auth.GET("/profile", middleware.AuthMiddleware(handlers.AuthService), handlers.Auth.GetProfile)
			auth.POST("/logout", middleware.AuthMiddleware(handlers.AuthService), handlers.Auth.Logout)
		}

		// User routes (auth required)
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(handlers.AuthService))
		{
			users.GET("/profile", handlers.User.GetProfile)
			users.PUT("/profile", handlers.User.UpdateProfile)
			users.DELETE("/account", handlers.User.DeleteAccount)
		}

		// Item routes (auth required)
		items := v1.Group("/items")
		items.Use(middleware.AuthMiddleware(handlers.AuthService))
		{
			items.GET("", handlers.Item.GetItems)
			items.POST("", handlers.Item.CreateItem)
			items.GET("/:id", handlers.Item.GetItem)
			items.PUT("/:id", handlers.Item.UpdateItem)
			items.DELETE("/:id", handlers.Item.DeleteItem)
			items.GET("/search", handlers.Item.SearchItems)
		}

		// Collection routes (auth required)
		collections := v1.Group("/collections")
		collections.Use(middleware.AuthMiddleware(handlers.AuthService))
		{
			collections.GET("", handlers.Collection.GetCollections)
			collections.POST("", handlers.Collection.CreateCollection)
			collections.GET("/:id", handlers.Collection.GetCollection)
			collections.PUT("/:id", handlers.Collection.UpdateCollection)
			collections.DELETE("/:id", handlers.Collection.DeleteCollection)
			collections.POST("/:id/items", handlers.Collection.AddItemToCollection)
			collections.DELETE("/:id/items/:itemId", handlers.Collection.RemoveItemFromCollection)
		}

		// Analytics routes (auth required)
		analytics := v1.Group("/analytics")
		analytics.Use(middleware.AuthMiddleware(handlers.AuthService))
		{
			analytics.GET("/overview", handlers.Analytics.GetOverview)
			analytics.GET("/trends", handlers.Analytics.GetTrends)
			analytics.GET("/insights", handlers.Analytics.GetInsights)
		}
	}

	// Public routes (no auth required)
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service":   "Digital Wardrobe API",
			"version":   "1.0.0",
			"status":    "operational",
			"timestamp": gin.H{"iso": "2024-01-01T00:00:00Z"},
		})
	})
}
