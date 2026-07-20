#!/bin/bash

# =====================================================================
# LullabyAI Studio Linux Bootstrap Script
# =====================================================================

echo "====================================================="
echo "🎵 LullabyAI Studio: Launching Autonomous Kids Video Suite..."
echo "====================================================="

# 1. Install Node modules
if [ ! -d "node_modules" ]; then
    echo "📦 Node modules not found. Running dependency installation..."
    npm install
else
    echo "✅ Dependencies already installed."
fi

# 2. Compile client assets and bundle backend server
echo "🔨 Compiling static bundles and bundling full stack engine..."
npm run build

# 3. Spin up full stack daemon on port 3000
echo "🚀 Booting up Express Node application..."
npm start
