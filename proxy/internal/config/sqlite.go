package config

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

// SQLiteClient wraps the SQLite database connection
type SQLiteClient struct {
	db *sql.DB
}

// NewSQLiteClient creates a new SQLite database connection
func NewSQLiteClient() (*SQLiteClient, error) {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "/data/users.db"
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Enable foreign keys
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		return nil, fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	return &SQLiteClient{db: db}, nil
}

// GetDB returns the underlying database connection
func (c *SQLiteClient) GetDB() *sql.DB {
	return c.db
}

// Close closes the database connection
func (c *SQLiteClient) Close() error {
	return c.db.Close()
}
