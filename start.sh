#!/bin/bash

if [ -z "$ANTHROPIC_API_KEY" ]; then
  if [ -f backend/.env ]; then
    export $(cat backend/.env | xargs)
  else
    echo "Error: ANTHROPIC_API_KEY is not set"
    echo "Create backend/.env file with: ANTHROPIC_API_KEY=your-key"
    exit 1
  fi
fi

ROOT_DIR=$(pwd)

echo "Starting backend on port 8080..."
cd "$ROOT_DIR/backend" && go run main.go &
BACKEND_PID=$!

sleep 2

echo "Starting frontend on port 3000..."
cd "$ROOT_DIR/frontend" && npm start &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
