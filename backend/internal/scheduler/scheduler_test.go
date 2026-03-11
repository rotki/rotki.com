package scheduler

import (
	"context"
	"log/slog"
	"sync/atomic"
	"testing"
	"time"
)

func testLogger() *slog.Logger {
	return slog.New(slog.DiscardHandler)
}

func TestNew(t *testing.T) {
	s := New(testLogger())
	if s == nil {
		t.Fatal("expected non-nil scheduler")
	}
	if len(s.tasks) != 0 {
		t.Fatalf("expected 0 tasks, got %d", len(s.tasks))
	}
}

func TestAdd(t *testing.T) {
	s := New(testLogger())
	s.Add("test-task", time.Second, func(_ context.Context) error { return nil })

	if len(s.tasks) != 1 {
		t.Fatalf("expected 1 task, got %d", len(s.tasks))
	}
	if s.tasks[0].Name != "test-task" {
		t.Fatalf("expected task name 'test-task', got %q", s.tasks[0].Name)
	}
	if s.tasks[0].Interval != time.Second {
		t.Fatalf("expected 1s interval, got %v", s.tasks[0].Interval)
	}
}

func TestStartRunsTaskAfterDelay(t *testing.T) {
	s := New(testLogger())

	var count atomic.Int32
	s.Add("counter", time.Hour, func(_ context.Context) error {
		count.Add(1)
		return nil
	})

	s.Start(10 * time.Millisecond)
	// Wait for initial delay + execution
	time.Sleep(50 * time.Millisecond)
	s.Stop()

	got := count.Load()
	if got < 1 {
		t.Fatalf("expected task to run at least once, ran %d times", got)
	}
}

func TestStartMultipleTasks(t *testing.T) {
	s := New(testLogger())

	var countA, countB atomic.Int32
	s.Add("task-a", time.Hour, func(_ context.Context) error {
		countA.Add(1)
		return nil
	})
	s.Add("task-b", time.Hour, func(_ context.Context) error {
		countB.Add(1)
		return nil
	})

	s.Start(10 * time.Millisecond)
	time.Sleep(50 * time.Millisecond)
	s.Stop()

	if countA.Load() < 1 {
		t.Fatal("task-a did not run")
	}
	if countB.Load() < 1 {
		t.Fatal("task-b did not run")
	}
}

func TestTaskRunsOnInterval(t *testing.T) {
	s := New(testLogger())

	var count atomic.Int32
	s.Add("repeating", 20*time.Millisecond, func(_ context.Context) error {
		count.Add(1)
		return nil
	})

	s.Start(5 * time.Millisecond)
	// Wait for initial delay (5ms) + first run + at least 2 interval ticks (40ms)
	time.Sleep(80 * time.Millisecond)
	s.Stop()

	got := count.Load()
	if got < 2 {
		t.Fatalf("expected task to run at least 2 times, ran %d times", got)
	}
}

func TestStopCancelsContext(t *testing.T) {
	s := New(testLogger())

	ctxCancelled := make(chan struct{})
	s.Add("ctx-check", time.Hour, func(ctx context.Context) error {
		<-ctx.Done()
		close(ctxCancelled)
		return nil
	})

	s.Start(1 * time.Millisecond)
	// Wait for task to start blocking on ctx.Done()
	time.Sleep(20 * time.Millisecond)

	s.Stop()

	select {
	case <-ctxCancelled:
		// success
	case <-time.After(time.Second):
		t.Fatal("context was not cancelled after Stop")
	}
}

func TestStopBeforeTaskRuns(t *testing.T) {
	s := New(testLogger())

	var count atomic.Int32
	s.Add("never-runs", time.Hour, func(_ context.Context) error {
		count.Add(1)
		return nil
	})

	s.Start(time.Hour) // very long initial delay
	s.Stop()

	if count.Load() != 0 {
		t.Fatal("task should not have run")
	}
}

func TestTaskErrorDoesNotStopScheduler(t *testing.T) {
	s := New(testLogger())

	var count atomic.Int32
	s.Add("failing", 15*time.Millisecond, func(_ context.Context) error {
		count.Add(1)
		return context.DeadlineExceeded // simulate error
	})

	s.Start(5 * time.Millisecond)
	time.Sleep(60 * time.Millisecond)
	s.Stop()

	got := count.Load()
	if got < 2 {
		t.Fatalf("expected task to keep running after errors, ran %d times", got)
	}
}
