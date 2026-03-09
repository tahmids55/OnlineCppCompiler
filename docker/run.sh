#!/bin/sh
# Do NOT use set -e — we need manual exit code handling

# Phase 1: Compile
COMPILE_OUTPUT=$(g++ /workspace/main.cpp -O2 -std=c++17 -o /workspace/main 2>&1)
COMPILE_EXIT=$?

if [ $COMPILE_EXIT -ne 0 ]; then
    echo "---COMPILE_ERROR---"
    printf '%s\n' "$COMPILE_OUTPUT"
    echo "---END---"
    exit 1
fi

# Phase 2: Execute with timeout
cd /workspace
timeout 2 ./main < input.txt > output.txt 2> error.txt
RUN_EXIT=$?

echo "---OUTPUT_START---"
cat /workspace/output.txt
echo "---OUTPUT_END---"
echo "---ERROR_START---"
cat /workspace/error.txt
echo "---ERROR_END---"
echo "---EXIT_CODE:${RUN_EXIT}---"
