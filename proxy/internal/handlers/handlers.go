package handlers

import (
	"database/sql"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"github.com/grrr/latency-sim-proxy/internal/models"
	"github.com/grrr/latency-sim-proxy/internal/proxy"
)

// Handler holds the application handlers and dependencies
type Handler struct {
	logger *zap.Logger
	repo   *models.Repository
}

// NewHandler creates a new Handler instance
func NewHandler(logger *zap.Logger, db *sql.DB) *Handler {
	return &Handler{
		logger: logger,
		repo:   models.NewRepository(db),
	}
}

// SandboxHandler handles the sandbox endpoint (no auth required)
func (h *Handler) SandboxHandler(c *fiber.Ctx) error {
	// Parse query parameters
	targetURL := c.Query("url")
	if targetURL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "url parameter is required",
		})
	}

	failRate, _ := strconv.ParseFloat(c.Query("failrate", "0"), 64)
	failCodes, _ := proxy.ParseFailCodes(c.Query("failCodes"))
	minLatency, _ := strconv.Atoi(c.Query("minLatency", "0"))
	maxLatency, _ := strconv.Atoi(c.Query("maxLatency", "0"))

	// Create proxy configuration
	config := &proxy.ProxyConfig{
		TargetURL:  targetURL,
		FailRate:   failRate,
		FailCodes:  failCodes,
		MinLatency: minLatency,
		MaxLatency: maxLatency,
	}

	// Create proxy handler
	proxyHandler := proxy.NewProxyHandler(h.logger, config)

	// Handle the request
	if err := proxyHandler.HandleFiberRequest(c); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return nil
}

// ProxyHandler handles the proxy endpoint with database configuration
func (h *Handler) ProxyHandler(c *fiber.Ctx) error {
	// Extract API key - check query parameter first, then headers
	apiKeyStr := c.Query("api_key")
	if apiKeyStr == "" {
		apiKeyStr = c.Get("X-API-Key")
	}
	if apiKeyStr == "" {
		// Also check Authorization header (Bearer token)
		authHeader := c.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			apiKeyStr = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if apiKeyStr == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "API key required. Provide via ?api_key= parameter, X-API-Key header, or Authorization: Bearer <key>",
		})
	}

	// Validate API key
	apiKey, err := h.repo.GetApiKeyByKey(apiKeyStr)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid API key",
			})
		}
		h.logger.Error("Failed to fetch API key", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}

	// Check if API key is active
	if !apiKey.IsActive {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "API key is inactive",
		})
	}

	// Get collection ID from path
	collectionIDStr := c.Params("collectionId")
	collectionID, err := strconv.Atoi(collectionIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid collection ID",
		})
	}

	// Check if API key has access to this collection
	hasAccess, err := h.repo.HasApiKeyAccessToCollection(apiKey.ID, collectionID)
	if err != nil {
		h.logger.Error("Failed to check API key access", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}
	if !hasAccess {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "API key does not have access to this collection",
		})
	}

	// Get collection from database
	collection, err := h.repo.GetCollectionByID(collectionID)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Collection not found",
			})
		}
		h.logger.Error("Failed to fetch collection", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}

	// Check if collection is active
	if !collection.IsActive {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Collection is inactive",
		})
	}

	// Get target URL from query parameter
	targetURL := c.Query("url")
	if targetURL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "url parameter is required",
		})
	}

	// Find matching endpoint by URL prefix
	endpoint, err := h.repo.GetEndpointByCollectionAndURL(collectionID, targetURL)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "No matching endpoint found for this URL in the collection",
				"url":   targetURL,
				"hint":  "Make sure the URL matches one of the configured endpoints",
			})
		}
		h.logger.Error("Failed to fetch endpoint", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}

	// Increment request counters (async to not block request)
	go func() {
		if err := h.repo.IncrementApiKeyRequestCount(apiKey.ID); err != nil {
			h.logger.Error("Failed to increment API key request count", zap.Error(err))
		}
		if err := h.repo.IncrementCollectionRequestCount(collectionID); err != nil {
			h.logger.Error("Failed to increment collection request count", zap.Error(err))
		}
		if err := h.repo.IncrementEndpointRequestCount(endpoint.ID); err != nil {
			h.logger.Error("Failed to increment endpoint request count", zap.Error(err))
		}
	}()

	// Create proxy configuration from endpoint settings
	config := &proxy.ProxyConfig{
		TargetURL:  targetURL,
		FailRate:   float64(endpoint.FailRate) / 100.0, // Convert percentage to decimal
		FailCodes:  []int{500, 502, 503},               // Default error codes
		MinLatency: endpoint.MinLatency,
		MaxLatency: endpoint.MaxLatency,
	}

	h.logger.Info("Proxying request",
		zap.String("collection", collection.Name),
		zap.String("endpoint", endpoint.Name),
		zap.String("targetURL", targetURL),
		zap.Int("minLatency", config.MinLatency),
		zap.Int("maxLatency", config.MaxLatency),
		zap.Float64("failRate", config.FailRate),
	)

	// Create proxy handler
	proxyHandler := proxy.NewProxyHandler(h.logger, config)

	// Handle the request
	if err := proxyHandler.HandleFiberRequest(c); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return nil
}
