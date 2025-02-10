#!/bin/bash

# Function to handle cleanup when script is terminated
cleanup() {
    echo "Stopping all npm processes..."
    # Kill all child processes
    pkill -P $$
    exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

echo "Starting playground and dev servers in parallel..."

# Run both commands in parallel
npm run playground & # Run playground in background
PLAYGROUND_PID=$!   # Store playground process ID

npm run dev &       # Run dev in background
DEV_PID=$!         # Store dev process ID

npm run dev-types & # Run build-types in background
BUILD_TYPES_PID=$!   # Store build-types process ID

# Wait for both processes to complete
wait $PLAYGROUND_PID $DEV_PID $BUILD_TYPES_PID
