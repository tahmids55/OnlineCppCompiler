#!/bin/sh
set -e

echo "Starting Docker daemon..."
dockerd &

# Wait for Docker daemon to be ready
echo "Waiting for Docker daemon..."
until docker info > /dev/null 2>&1; do
    sleep 1
done

echo "Building sandbox image..."
cd /sandbox
docker build -t cpworkspace-sandbox -f Dockerfile .

echo "Sandbox image built successfully"
echo "Starting CP Workspace backend..."

exec /usr/local/bin/server
