package api

import (
	"net/http"

	"cpworkspace-backend/execution"

	"github.com/gin-gonic/gin"
)

// RunCode handles POST /api/run
func RunCode(c *gin.Context) {
	var req execution.RunRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: code field is required"})
		return
	}

	result, err := execution.Execute(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Execution failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
