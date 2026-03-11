package cache

import (
	"fmt"
	"testing"
	"time"
)

func TestMemory_SetGet(t *testing.T) {
	m := NewMemory()
	defer m.Close()

	m.Set("key1", "value1", time.Minute)

	val, ok := m.Get("key1")
	if !ok {
		t.Fatal("expected key1 to exist")
	}
	if val != "value1" {
		t.Fatalf("expected value1, got %v", val)
	}
}

func TestMemory_Expiry(t *testing.T) {
	m := NewMemory()
	defer m.Close()

	m.Set("key1", "value1", time.Millisecond)
	time.Sleep(5 * time.Millisecond)

	_, ok := m.Get("key1")
	if ok {
		t.Fatal("expected key1 to be expired")
	}
}

func TestMemory_Delete(t *testing.T) {
	m := NewMemory()
	defer m.Close()

	m.Set("key1", "value1", time.Minute)
	m.Delete("key1")

	_, ok := m.Get("key1")
	if ok {
		t.Fatal("expected key1 to be deleted")
	}
}

func TestMemory_Miss(t *testing.T) {
	m := NewMemory()
	defer m.Close()

	_, ok := m.Get("nonexistent")
	if ok {
		t.Fatal("expected miss for nonexistent key")
	}
}

func TestMemory_MaxEntries(t *testing.T) {
	m := NewMemory()
	defer m.Close()

	// Fill to capacity
	for i := range maxEntries {
		m.Set(fmt.Sprintf("key%d", i), i, time.Minute)
	}

	// New key should be silently dropped
	m.Set("overflow", "nope", time.Minute)
	_, ok := m.Get("overflow")
	if ok {
		t.Fatal("expected overflow key to be rejected")
	}

	// Overwrite existing key should still work
	m.Set("key0", "updated", time.Minute)
	val, ok := m.Get("key0")
	if !ok || val != "updated" {
		t.Fatalf("expected overwrite to succeed, got ok=%v val=%v", ok, val)
	}
}

func TestMemory_Overwrite(t *testing.T) {
	m := NewMemory()
	defer m.Close()

	m.Set("key1", "v1", time.Minute)
	m.Set("key1", "v2", time.Minute)

	val, ok := m.Get("key1")
	if !ok {
		t.Fatal("expected key1 to exist")
	}
	if val != "v2" {
		t.Fatalf("expected v2, got %v", val)
	}
}
