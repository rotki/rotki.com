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

	// RetryInterval, when set, reruns a failed task after this delay instead of
	// waiting the full Interval, up to MaxRetries consecutive times.
	RetryInterval time.Duration
	MaxRetries    int
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

// AddWithRetry registers a task that reruns after retryInterval when it fails,
// up to maxRetries consecutive times before falling back to the regular interval.
func (s *Scheduler) AddWithRetry(name string, interval, retryInterval time.Duration, maxRetries int, fn TaskFunc) {
	s.tasks = append(s.tasks, Task{
		Name:          name,
		Interval:      interval,
		Fn:            fn,
		RetryInterval: retryInterval,
		MaxRetries:    maxRetries,
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

	// Run immediately, then on interval (or sooner after a failure, if retries are configured)
	retries := 0
	for {
		next := task.Interval
		if err := s.executeTask(ctx, task, taskLogger); err != nil && task.RetryInterval > 0 && retries < task.MaxRetries {
			retries++
			next = task.RetryInterval
			taskLogger.Warn("task scheduled for early retry",
				"retry", retries, "max_retries", task.MaxRetries, "retry_in", next.String())
		} else {
			retries = 0
		}

		timer := time.NewTimer(next)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
		}
	}
}

// taskTimeout is the maximum duration a single task execution may take.
const taskTimeout = 2 * time.Minute

func (s *Scheduler) executeTask(ctx context.Context, task Task, logger *slog.Logger) error {
	start := time.Now()
	logger.Info("task starting")

	taskCtx, cancel := context.WithTimeout(ctx, taskTimeout)
	defer cancel()

	if err := task.Fn(taskCtx); err != nil {
		logger.Error("task failed", "error", err, "duration", time.Since(start).Round(time.Millisecond).String())
		return err
	}

	logger.Info("task completed", "duration", time.Since(start).Round(time.Millisecond).String())
	return nil
}
