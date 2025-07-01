#!/bin/bash

echo "🎯 Starting PDF Presentation Server..."
echo "📂 Directory: $(pwd)"
echo ""

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found!"
    echo "💡 Please run this script from the ver_lect directory"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Start the server
echo "🔄 Starting server..."
node server.js 