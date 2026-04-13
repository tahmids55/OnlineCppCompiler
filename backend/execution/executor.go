package execution

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// RunRequest contains the code and input to execute
type RunRequest struct {
	Code  string `json:"code" binding:"required"`
	Input string `json:"input"`
}

// RunResult contains the execution output
type RunResult struct {
	Output        string  `json:"output"`
	Error         string  `json:"error"`
	CompileError  string  `json:"compile_error,omitempty"`
	ExecutionTime float64 `json:"execution_time"` // in seconds
	ExitCode      int     `json:"exit_code"`
	TimedOut      bool    `json:"timed_out"`
}

const (
	maxCodeSize  = 100 * 1024     // 100KB max code size
	maxInputSize = 10 * 1024 * 1024 // 10MB max input size
	timeoutSecs  = 5 // total container timeout (compile + run)

	runTimeoutSecs = 2
	memoryLimit    = "256m"
	cpuLimit       = "1.0"
	pidsLimit      = "64"
	imageName      = "cpworkspace-sandbox"
)

// Execute runs the user's C++ code.
// Execution mode is controlled by EXECUTION_MODE: docker | local | auto (default).
func Execute(ctx context.Context, req RunRequest) (*RunResult, error) {
	// Validate input sizes
	if len(req.Code) > maxCodeSize {
		return &RunResult{
			CompileError: "Code exceeds maximum size (100KB)",
			ExitCode:     1,
		}, nil
	}
	if len(req.Input) > maxInputSize {
		return &RunResult{
			Error:    "Input exceeds maximum size (10MB)",
			ExitCode: 1,
		}, nil
	}

	// Create temporary workspace
	sessionID := uuid.New().String()
	workDir := filepath.Join(os.TempDir(), "cpworkspace", sessionID)

	if err := os.MkdirAll(workDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create workspace: %w", err)
	}
	defer os.RemoveAll(workDir) // Always clean up

	// Write main.cpp
	mainPath := filepath.Join(workDir, "main.cpp")
	if err := os.WriteFile(mainPath, []byte(req.Code), 0644); err != nil {
		return nil, fmt.Errorf("failed to write main.cpp: %w", err)
	}

	// Write input.txt
	inputPath := filepath.Join(workDir, "input.txt")
	if err := os.WriteFile(inputPath, []byte(req.Input), 0644); err != nil {
		return nil, fmt.Errorf("failed to write input.txt: %w", err)
	}

	startTime := time.Now()
	result, err := executeByMode(ctx, workDir)
	if err != nil {
		return nil, err
	}

	result.ExecutionTime = time.Since(startTime).Seconds()
	return result, nil
}

func executeByMode(ctx context.Context, workDir string) (*RunResult, error) {
	mode := strings.ToLower(strings.TrimSpace(os.Getenv("EXECUTION_MODE")))

	switch mode {
	case "", "auto":
		if _, err := exec.LookPath("docker"); err == nil {
			if res, dockerErr := executeInDocker(ctx, workDir); dockerErr == nil {
				return res, nil
			}
		}
		return executeLocally(ctx, workDir)
	case "docker":
		return executeInDocker(ctx, workDir)
	case "local":
		return executeLocally(ctx, workDir)
	default:
		return nil, fmt.Errorf("invalid EXECUTION_MODE: %s", mode)
	}
}

func executeInDocker(ctx context.Context, workDir string) (*RunResult, error) {
	args := []string{
		"run",
		"--rm",                          // Auto-remove container
		"--network=none",                // No network access
		"--memory=" + memoryLimit,       // Memory limit
		"--cpus=" + cpuLimit,            // CPU limit
		"--pids-limit=" + pidsLimit,     // Process limit
		"--read-only",                   // Read-only root filesystem
		"--tmpfs=/tmp:size=64m",         // Writable tmp
		"--security-opt=no-new-privileges", // No privilege escalation
		"-v", workDir + ":/workspace:rw",   // Mount workspace
		imageName,
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, time.Duration(timeoutSecs)*time.Second)
	defer cancel()

	cmd := exec.CommandContext(timeoutCtx, "docker", args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	result := &RunResult{}

	rawOutput := stdout.String()

	// Parse the structured output from our sandbox script
	if strings.Contains(rawOutput, "---COMPILE_ERROR---") {
		// Compilation failed
		compileErr := extractBetween(rawOutput, "---COMPILE_ERROR---", "---END---")
		result.CompileError = strings.TrimSpace(compileErr)
		result.ExitCode = 1
		return result, nil
	}

	// Extract output and error
	result.Output = strings.TrimSpace(extractBetween(rawOutput, "---OUTPUT_START---", "---OUTPUT_END---"))
	result.Error = strings.TrimSpace(extractBetween(rawOutput, "---ERROR_START---", "---ERROR_END---"))

	// Check for timeout
	if timeoutCtx.Err() == context.DeadlineExceeded {
		result.TimedOut = true
		result.Error = "Time Limit Exceeded (2 seconds)"
		result.ExitCode = 124
		return result, nil
	}

	// Get exit code
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitErr.ExitCode()
			// Check if it was a timeout from the `timeout` command inside container
			if result.ExitCode == 124 {
				result.TimedOut = true
				result.Error = "Time Limit Exceeded (2 seconds)"
			}
		} else {
			return nil, fmt.Errorf("docker execution failed: %w", err)
		}
	}

	return result, nil
}

func executeLocally(ctx context.Context, workDir string) (*RunResult, error) {
	result := &RunResult{}

	binaryPath := filepath.Join(workDir, "main")
	mainPath := filepath.Join(workDir, "main.cpp")
	inputPath := filepath.Join(workDir, "input.txt")

	compileCtx, compileCancel := context.WithTimeout(ctx, time.Duration(timeoutSecs)*time.Second)
	defer compileCancel()

	compileCmd := exec.CommandContext(compileCtx,
		"g++",
		mainPath,
		"-O2",
		"-std=c++17",
		"-o",
		binaryPath,
	)

	var compileOut, compileErr bytes.Buffer
	compileCmd.Stdout = &compileOut
	compileCmd.Stderr = &compileErr

	if err := compileCmd.Run(); err != nil {
		if compileCtx.Err() == context.DeadlineExceeded {
			result.CompileError = "Compilation timed out"
			result.ExitCode = 124
			return result, nil
		}

		combined := strings.TrimSpace(firstNonEmpty(compileErr.String(), compileOut.String(), err.Error()))
		if combined == "" {
			combined = "Compilation failed"
		}
		result.CompileError = combined
		result.ExitCode = 1
		return result, nil
	}

	inputFile, err := os.Open(inputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open input.txt: %w", err)
	}
	defer inputFile.Close()

	runCtx, runCancel := context.WithTimeout(ctx, time.Duration(runTimeoutSecs)*time.Second)
	defer runCancel()

	runCmd := exec.CommandContext(runCtx, binaryPath)
	runCmd.Stdin = inputFile

	var stdout, stderr bytes.Buffer
	runCmd.Stdout = &stdout
	runCmd.Stderr = &stderr

	err = runCmd.Run()
	result.Output = strings.TrimSpace(stdout.String())
	result.Error = strings.TrimSpace(stderr.String())

	if runCtx.Err() == context.DeadlineExceeded {
		result.TimedOut = true
		result.Error = "Time Limit Exceeded (2 seconds)"
		result.ExitCode = 124
		return result, nil
	}

	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitErr.ExitCode()
			return result, nil
		}
		return nil, fmt.Errorf("local execution failed: %w", err)
	}

	result.ExitCode = 0
	return result, nil
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

// extractBetween extracts text between two markers
func extractBetween(s, start, end string) string {
	startIdx := strings.Index(s, start)
	if startIdx == -1 {
		return ""
	}
	startIdx += len(start)

	endIdx := strings.Index(s[startIdx:], end)
	if endIdx == -1 {
		return s[startIdx:]
	}

	return s[startIdx : startIdx+endIdx]
}
