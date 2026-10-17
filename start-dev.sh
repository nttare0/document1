#!/bin/bash
export NODE_ENV=development
export XAI_API_KEY=${XAI_API_KEY:-"sk-dummy-key-for-development"}
npx tsx server/index.ts