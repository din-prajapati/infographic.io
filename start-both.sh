#!/bin/bash

# Start both Express frontend and NestJS API concurrently

echo "🚀 Starting InfographicAI platform..."
echo "📦 Express frontend will run on port 5000"
echo "🔧 NestJS API will run on port 3001"
echo ""

# Function to cleanup on exit
cleanup() {
  echo "Shutting down servers..."
  kill $NEST_PID $EXPRESS_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

# Start NestJS API in background
cd api
DATABASE_URL="${DATABASE_URL}" \
OPENAI_API_KEY="${OPENAI_API_KEY}" \
IDEOGRAM_API_KEY="${IDEOGRAM_API_KEY}" \
JWT_SECRET="infographic-jwt-secret" \
API_PORT=3001 \
tsx src/main.ts &
NEST_PID=$!
cd ..

# Give NestJS time to start
sleep 3

# Start Express frontend
npm run dev &
EXPRESS_PID=$!

# Wait for both processes
wait
