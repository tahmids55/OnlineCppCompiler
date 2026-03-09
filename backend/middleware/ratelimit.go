package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type clientInfo struct {
	count    int
	lastSeen time.Time
}

var (
	clients = make(map[string]*clientInfo)
	mu      sync.Mutex
)

const (
	rateLimit  = 10            // max requests per window
	rateWindow = time.Minute   // time window
	cleanupInt = 5 * time.Minute
)

func init() {
	// Periodically clean up old entries
	go func() {
		for {
			time.Sleep(cleanupInt)
			mu.Lock()
			now := time.Now()
			for ip, info := range clients {
				if now.Sub(info.lastSeen) > rateWindow*2 {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()
}

// RateLimiter limits requests per IP
func RateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only rate limit the /api/run endpoint
		if c.Request.URL.Path != "/api/run" {
			c.Next()
			return
		}

		ip := c.ClientIP()
		mu.Lock()

		info, exists := clients[ip]
		now := time.Now()

		if !exists {
			clients[ip] = &clientInfo{count: 1, lastSeen: now}
			mu.Unlock()
			c.Next()
			return
		}

		// Reset counter if window expired
		if now.Sub(info.lastSeen) > rateWindow {
			info.count = 1
			info.lastSeen = now
			mu.Unlock()
			c.Next()
			return
		}

		info.count++
		info.lastSeen = now

		if info.count > rateLimit {
			mu.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Please wait before running again.",
			})
			c.Abort()
			return
		}

		mu.Unlock()
		c.Next()
	}
}
