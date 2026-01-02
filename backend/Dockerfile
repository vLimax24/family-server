# Stage: Builder / Dev
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . /app

# -----------------------------
# Stage: Production
# -----------------------------
FROM python:3.11-slim AS prod

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 8000

# Run FastAPI dev server (dev/prod can be switched with --target in build)
CMD ["fastapi", "run", "app.py", "--host", "0.0.0.0", "--port", "8000"]

# Stage: Dev
FROM builder AS dev
EXPOSE 8000
CMD ["fastapi", "dev", "app.py", "--host", "0.0.0.0", "--port", "8000"]
