# ── Build Stage ──────────────────────────────────────────────
FROM rust:1.85-slim AS builder

# Install system deps needed by diesel (postgres)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only backend source
COPY backend/ .

# Build release binary
RUN cargo build --release

# ── Runtime Stage ─────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/backend /app/backend

EXPOSE 8080

CMD ["/app/backend"]
