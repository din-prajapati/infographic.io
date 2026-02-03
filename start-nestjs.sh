#!/bin/bash

# Start NestJS API Server
cd api

DATABASE_URL="${DATABASE_URL}" \
OPENAI_API_KEY="${OPENAI_API_KEY}" \
IDEOGRAM_API_KEY="${IDEOGRAM_API_KEY}" \
JWT_SECRET="infographic-jwt-secret" \
API_PORT=3001 \
tsx src/main.ts
