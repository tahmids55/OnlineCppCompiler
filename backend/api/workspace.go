package api

import (
	"net/http"

	"cpworkspace-backend/auth"

	"github.com/gin-gonic/gin"
)

// TemplateData represents a saved template
type TemplateData struct {
	Code string `json:"code"`
}

// WorkspaceData represents a saved workspace
type WorkspaceData struct {
	MainCpp  string `json:"main_cpp"`
	InputTxt string `json:"input_txt"`
}

// SaveTemplate handles POST /api/save-template
func SaveTemplate(c *gin.Context) {
	uid := c.GetString("uid")
	email := c.GetString("email")

	if auth.FirestoreClient == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database unavailable"})
		return
	}

	var data TemplateData
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx := c.Request.Context()

	// Ensure user document exists
	_, err := auth.FirestoreClient.Collection("users").Doc(uid).Set(ctx, map[string]interface{}{
		"email": email,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user"})
		return
	}

	// Save template
	_, err = auth.FirestoreClient.Collection("templates").Doc(uid).Set(ctx, map[string]interface{}{
		"user_id":       uid,
		"template_code": data.Code,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save template"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Template saved"})
}

// LoadTemplate handles GET /api/load-template
func LoadTemplate(c *gin.Context) {
	uid := c.GetString("uid")

	if auth.FirestoreClient == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database unavailable"})
		return
	}

	ctx := c.Request.Context()

	doc, err := auth.FirestoreClient.Collection("templates").Doc(uid).Get(ctx)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No template found"})
		return
	}

	data := doc.Data()
	c.JSON(http.StatusOK, gin.H{
		"code": data["template_code"],
	})
}

// SaveWorkspace handles POST /api/save-workspace
func SaveWorkspace(c *gin.Context) {
	uid := c.GetString("uid")

	if auth.FirestoreClient == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database unavailable"})
		return
	}

	var data WorkspaceData
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx := c.Request.Context()

	_, err := auth.FirestoreClient.Collection("workspace").Doc(uid).Set(ctx, map[string]interface{}{
		"user_id":   uid,
		"main_cpp":  data.MainCpp,
		"input_txt": data.InputTxt,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save workspace"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Workspace saved"})
}

// LoadWorkspace handles GET /api/load-workspace
func LoadWorkspace(c *gin.Context) {
	uid := c.GetString("uid")

	if auth.FirestoreClient == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database unavailable"})
		return
	}

	ctx := c.Request.Context()

	doc, err := auth.FirestoreClient.Collection("workspace").Doc(uid).Get(ctx)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No workspace found"})
		return
	}

	data := doc.Data()
	c.JSON(http.StatusOK, gin.H{
		"main_cpp":  data["main_cpp"],
		"input_txt": data["input_txt"],
	})
}
