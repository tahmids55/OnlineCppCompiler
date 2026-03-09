FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
RUN go mod download 2>/dev/null || true

COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o server .

# Production image
FROM docker:24-dind

# Install Go binary
COPY --from=builder /app/server /usr/local/bin/server

# Copy sandbox files
COPY docker/Dockerfile.sandbox /sandbox/Dockerfile
COPY docker/run.sh /sandbox/run.sh

# Build sandbox image on container start
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
