#!/bin/bash
cd api

export DATABASE_URL="${DATABASE_URL}"
export OPENAI_API_KEY="${OPENAI_API_KEY}"
export IDEOGRAM_API_KEY="${IDEOGRAM_API_KEY}"
export JWT_SECRET="infographic-ai-jwt-secret"
export API_PORT=3001

echo "Starting NestJS API on port 3001..."
exec tsx src/main.ts
