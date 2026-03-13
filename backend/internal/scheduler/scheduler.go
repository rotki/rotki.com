// Package scheduler runs periodic background tasks.
package scheduler

import (
	"context"
	"log/slog"
	"sync"
	"time"
)

// TaskFunc is a function that performs a scheduled task.
// It receives a context that is cancelled when the scheduler is stopped.
type TaskFunc func(ctx context.Context) error

// Task defines a recurring task.
type Task struct {
	Name     string
	Interval time.Duration
	Fn       TaskFunc
}

// Scheduler runs tasks on fixed intervals using goroutines.
type Scheduler struct {
	tasks  []Task
	logger *slog.Logger
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// New creates a new scheduler.
func New(logger *slog.Logger) *Scheduler {
	return &Scheduler{
		logger: logger.With("component", "scheduler"),
	}
}

// Add registers a task to be run on a fixed interval.
func (s *Scheduler) Add(name string, interval time.Duration, fn TaskFunc) {
	s.tasks = append(s.tasks, Task{
		Name:     name,
		Interval: interval,
		Fn:       fn,
	})
}

// Start launches all registered tasks. Each task runs once immediately
// (after initialDelay) then repeats on its interval.
func (s *Scheduler) Start(initialDelay time.Duration) {
	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel

	for _, task := range s.tasks {
		s.wg.Add(1)
		go s.runTask(ctx, task, initialDelay)
	}

	s.logger.Info("scheduler started", "tasks", len(s.tasks))
}

// Stop gracefully stops all tasks and waits for them to finish.
func (s *Scheduler) Stop() {
	if s.cancel != nil {
		s.cancel()
	}
	s.wg.Wait()
	s.logger.Info("scheduler stopped")
}

func (s *Scheduler) runTask(ctx context.Context, task Task, initialDelay time.Duration) {
	defer s.wg.Done()

	taskLogger := s.logger.With("task", task.Name)

	// Wait for initial delay before first run
	select {
	case <-ctx.Done():
		return
	case <-time.After(initialDelay):
	}

	// Run immediately, then on interval
	s.executeTask(ctx, task, taskLogger)

	ticker := time.NewTicker(task.Interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.executeTask(ctx, task, taskLogger)
		}
	}
}

// taskTimeout is the maximum duration a single task execution may take.
const taskTimeout = 2 * time.Minute

func (s *Scheduler) executeTask(ctx context.Context, task Task, logger *slog.Logger) {
	start := time.Now()
	logger.Info("task starting")

	taskCtx, cancel := context.WithTimeout(ctx, taskTimeout)
	defer cancel()

	if err := task.Fn(taskCtx); err != nil {
		logger.Error("task failed", "error", err, "duration", time.Since(start).Round(time.Millisecond).String())
		return
	}

	logger.Info("task completed", "duration", time.Since(start).Round(time.Millisecond).String())
}
