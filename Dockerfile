# Single-stage build — avoids missing shared library issues in slim runtime
FROM rust:1.86

# Install libpq and SSL deps
RUN apt-get update && apt-get install -y \
    libpq-dev \
    pkg-config \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend source
COPY backend/ .

# Build release binary
RUN cargo build --release

EXPOSE 8080

CMD ["./target/release/backend"]
