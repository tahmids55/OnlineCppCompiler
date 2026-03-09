package auth

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	firebaseAuth "firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

var (
	AuthClient      *firebaseAuth.Client
	FirestoreClient *firestore.Client
)

// InitFirebase initializes the Firebase Admin SDK
func InitFirebase() error {
	ctx := context.Background()

	var app *firebase.App
	var err error

	// Check for service account credentials
	credFile := os.Getenv("FIREBASE_CREDENTIALS")
	if credFile != "" {
		opt := option.WithCredentialsFile(credFile)
		app, err = firebase.NewApp(ctx, nil, opt)
	} else {
		credJSON := os.Getenv("FIREBASE_CREDENTIALS_JSON")
		if credJSON != "" {
			opt := option.WithCredentialsJSON([]byte(credJSON))
			app, err = firebase.NewApp(ctx, nil, opt)
		} else {
			// Try default credentials (for cloud deployments)
			app, err = firebase.NewApp(ctx, nil)
		}
	}

	if err != nil {
		return err
	}

	// Initialize Auth client
	AuthClient, err = app.Auth(ctx)
	if err != nil {
		return err
	}

	// Initialize Firestore client
	FirestoreClient, err = app.Firestore(ctx)
	if err != nil {
		log.Printf("Warning: Firestore init failed: %v", err)
		// Auth still works, just no persistence
	}

	log.Println("Firebase initialized successfully")
	return nil
}

// VerifyToken verifies a Firebase ID token and returns the UID
func VerifyToken(ctx context.Context, idToken string) (string, string, error) {
	token, err := AuthClient.VerifyIDToken(ctx, idToken)
	if err != nil {
		return "", "", err
	}

	email, _ := token.Claims["email"].(string)
	return token.UID, email, nil
}
