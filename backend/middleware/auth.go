package middleware

import (
	"net/http"
	"strings"

	"cpworkspace-backend/auth"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware verifies Firebase ID tokens
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if auth.AuthClient == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "Authentication service unavailable",
			})
			c.Abort()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No authorization header"})
			c.Abort()
			return
		}

		// Extract Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		idToken := parts[1]
		uid, email, err := auth.VerifyToken(c.Request.Context(), idToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("uid", uid)
		c.Set("email", email)
		c.Next()
	}
}
