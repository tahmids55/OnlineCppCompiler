package main

import (
	"log"
	"os"
	"strings"

	"cpworkspace-backend/api"
	"cpworkspace-backend/auth"
	"cpworkspace-backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if present (local development)
	if err := godotenv.Load(); err == nil {
		log.Println("Loaded .env file")
	}

	// Initialize Firebase
	if err := auth.InitFirebase(); err != nil {
		log.Printf("Warning: Firebase initialization failed: %v", err)
		log.Println("Running without Firebase — save/load features disabled")
	}

	router := gin.Default()

	// CORS configuration
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:5173,http://localhost:3000"
	}

	corsConfig := cors.Config{
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}

	if allowedOrigins == "*" {
		corsConfig.AllowAllOrigins = true
	} else {
		corsConfig.AllowOrigins = splitOrigins(allowedOrigins)
	}

	router.Use(cors.New(corsConfig))

	// Rate limiter middleware
	router.Use(middleware.RateLimiter())

	// Public routes
	apiGroup := router.Group("/api")
	{
		apiGroup.POST("/run", api.RunCode)
	}

	// Authenticated routes
	authGroup := router.Group("/api")
	authGroup.Use(middleware.AuthMiddleware())
	{
		authGroup.POST("/save-template", api.SaveTemplate)
		authGroup.GET("/load-template", api.LoadTemplate)
		authGroup.POST("/save-workspace", api.SaveWorkspace)
		authGroup.GET("/load-workspace", api.LoadWorkspace)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Root redirect to frontend
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"service": "CP Workspace API", "version": "1.0", "docs": "/health"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("CP Workspace backend starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func splitOrigins(origins string) []string {
	result := []string{}
	current := ""
	for _, ch := range origins {
		if ch == ',' {
			current = strings.TrimSpace(current)
			if current != "" {
				result = append(result, current)
			}
			current = ""
		} else {
			current += string(ch)
		}
	}
	current = strings.TrimSpace(current)
	if current != "" {
		result = append(result, current)
	}
	return result
}
