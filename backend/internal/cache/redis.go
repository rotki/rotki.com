package cache

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// Redis wraps a Redis client for L2 caching.
// If no Redis is configured, all operations are no-ops (returns miss).
type Redis struct {
	client *redis.Client
	logger *slog.Logger
	prefix string
}

// NewRedis creates a Redis cache. If host is empty, returns a no-op instance.
func NewRedis(host, password string, logger *slog.Logger) *Redis {
	r := &Redis{
		logger: logger.With("component", "cache.redis"),
		prefix: "cache:",
	}

	if host == "" {
		r.logger.Info("no Redis host configured, using memory-only caching")
		return r
	}

	addr := host
	if !strings.Contains(addr, ":") {
		addr += ":6379"
	}

	r.client = redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     password,
		DB:           0,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		DialTimeout:  5 * time.Second,
		PoolSize:     10,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := r.client.Ping(ctx).Err(); err != nil {
		r.logger.Error("Redis connection failed, falling back to memory-only", "error", err)
		r.client = nil
	} else {
		r.logger.Info("Redis connected", "host", host)
	}

	return r
}

// Available returns true if Redis is connected.
func (r *Redis) Available() bool {
	return r.client != nil
}

// Get retrieves a value from Redis and unmarshals it into dst.
// Returns false on miss or error.
func (r *Redis) Get(ctx context.Context, key string, dst any) bool {
	if r.client == nil {
		return false
	}

	val, err := r.client.Get(ctx, r.prefix+key).Result()
	if err != nil {
		if !errors.Is(err, redis.Nil) {
			r.logger.Error("Redis GET error", "key", key, "error", err)
		}
		return false
	}

	if err := json.Unmarshal([]byte(val), dst); err != nil {
		r.logger.Error("Redis unmarshal error", "key", key, "error", err)
		return false
	}

	return true
}

// GetString retrieves a raw string value from Redis.
func (r *Redis) GetString(ctx context.Context, key string) (string, bool) {
	if r.client == nil {
		return "", false
	}

	val, err := r.client.Get(ctx, r.prefix+key).Result()
	if err != nil {
		if !errors.Is(err, redis.Nil) {
			r.logger.Error("Redis GET error", "key", key, "error", err)
		}
		return "", false
	}

	return val, true
}

// Set stores a JSON-serialized value in Redis with a TTL.
func (r *Redis) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	if r.client == nil {
		return nil
	}

	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	return r.client.Set(ctx, r.prefix+key, data, ttl).Err()
}

// SetString stores a raw string value in Redis with a TTL.
func (r *Redis) SetString(ctx context.Context, key, value string, ttl time.Duration) error {
	if r.client == nil {
		return nil
	}

	return r.client.Set(ctx, r.prefix+key, value, ttl).Err()
}

// Delete removes a key from Redis.
func (r *Redis) Delete(ctx context.Context, key string) error {
	if r.client == nil {
		return nil
	}

	return r.client.Del(ctx, r.prefix+key).Err()
}

// Close closes the Redis connection.
func (r *Redis) Close() error {
	if r.client == nil {
		return nil
	}
	return r.client.Close()
}
