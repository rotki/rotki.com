// Package cache provides in-memory and Redis-based caching with distributed locking.
package cache

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

// Lock provides distributed locking via Redis.
// If Redis is not available, locking is a no-op (always succeeds).
type Lock struct {
	redis  *Redis
	logger *slog.Logger
}

// NewLock creates a new distributed lock manager.
func NewLock(redis *Redis, logger *slog.Logger) *Lock {
	return &Lock{
		redis:  redis,
		logger: logger.With("component", "cache.lock"),
	}
}

// lockToken generates a unique token for lock ownership verification.
func lockToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// Acquire attempts to acquire a distributed lock.
// Returns a token string on success (used for Release), or empty string on failure.
func (l *Lock) Acquire(ctx context.Context, key string, ttl time.Duration) string {
	if !l.redis.Available() {
		// No Redis — always succeed (single instance)
		return "local"
	}

	lockKey := "lock:" + key
	token := lockToken()

	// Atomic lock acquisition: SET key value NX EX ttl
	_, err := l.redis.client.SetArgs(ctx, lockKey, token, redis.SetArgs{
		Mode: "NX",
		TTL:  ttl,
	}).Result()
	if errors.Is(err, redis.Nil) {
		l.logger.Debug("lock busy", "key", key)
		return ""
	}
	if err != nil {
		l.logger.Error("lock acquire error", "key", key, "error", err)
		return ""
	}

	l.logger.Debug("lock acquired", "key", key)
	return token
}

// releaseScript atomically checks ownership and deletes the lock.
// This prevents a race condition between GET and DEL (TOCTOU).
const releaseScript = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`

// Release releases a distributed lock if we still own it.
// Uses a Lua script for atomic check-and-delete.
func (l *Lock) Release(ctx context.Context, key, token string) {
	if !l.redis.Available() || token == "local" {
		return
	}

	lockKey := "lock:" + key

	result, err := l.redis.client.Eval(ctx, releaseScript, []string{lockKey}, token).Int64()
	if err != nil {
		l.logger.Error("lock release error", "key", key, "error", err)
		return
	}

	if result == 0 {
		l.logger.Warn("lock ownership changed, not releasing", "key", key)
		return
	}

	l.logger.Debug("lock released", "key", key)
}
