package cache

import (
	"sync"
	"time"
)

// maxEntries is the maximum number of entries allowed in the memory cache.
// Prevents unbounded growth if many unique keys are written.
const maxEntries = 1000

// entry holds a cached value with its expiration time.
type entry struct {
	data      any
	expiresAt time.Time
}

// Memory is an in-memory cache with TTL support.
// Used as L1 cache to avoid Redis roundtrips on every request.
// Each Go process has its own instance — not shared across processes.
type Memory struct {
	mu      sync.RWMutex
	entries map[string]entry
	stop    chan struct{}
}

// NewMemory creates a new in-memory cache with periodic cleanup.
func NewMemory() *Memory {
	m := &Memory{
		entries: make(map[string]entry),
		stop:    make(chan struct{}),
	}
	go m.cleanup()
	return m
}

// Get returns a cached value if it exists and hasn't expired.
// Expired entries are not eagerly deleted — the cleanup goroutine handles that.
func (m *Memory) Get(key string) (any, bool) {
	m.mu.RLock()
	e, ok := m.entries[key]
	m.mu.RUnlock()

	if !ok || time.Now().After(e.expiresAt) {
		return nil, false
	}

	return e.data, true
}

// Set stores a value with a TTL.
// If the cache is at capacity and the key is new, the write is silently dropped.
func (m *Memory) Set(key string, data any, ttl time.Duration) {
	m.mu.Lock()
	_, exists := m.entries[key]
	if !exists && len(m.entries) >= maxEntries {
		m.mu.Unlock()
		return
	}
	m.entries[key] = entry{
		data:      data,
		expiresAt: time.Now().Add(ttl),
	}
	m.mu.Unlock()
}

// Delete removes a specific key.
func (m *Memory) Delete(key string) {
	m.mu.Lock()
	delete(m.entries, key)
	m.mu.Unlock()
}

// cleanup removes expired entries every 5 minutes.
func (m *Memory) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			m.mu.Lock()
			now := time.Now()
			for k, e := range m.entries {
				if now.After(e.expiresAt) {
					delete(m.entries, k)
				}
			}
			m.mu.Unlock()
		case <-m.stop:
			return
		}
	}
}

// Close stops the cleanup goroutine.
func (m *Memory) Close() {
	close(m.stop)
}
