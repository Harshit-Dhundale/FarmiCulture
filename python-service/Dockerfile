# Use the official Python 3.8 slim image
FROM python:3.8-slim

# Set working directory
WORKDIR /app

# Install any system dependencies required by your libraries (e.g., for TensorFlow or image processing)
RUN apt-get update && apt-get install -y \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port that Render will use; Render will set the PORT env variable, but we default to 5001
EXPOSE 5001

# Use an entrypoint that expands environment variables for the bind address
CMD ["/bin/sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5001} app:app"]