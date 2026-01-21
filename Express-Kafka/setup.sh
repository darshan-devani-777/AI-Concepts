#!/bin/bash

echo "🚀 Express-Kafka Demo Setup"
echo "==========================="

# Check if Java is installed (required for Kafka)
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java first:"
    echo "   Download from: https://adoptium.net/"
    echo "   Or use: brew install openjdk@17"
    exit 1
fi

echo "✅ Java found"

# Check if Kafka is downloaded
if [ ! -d "kafka_2.13-3.6.1" ]; then
    echo "📦 Downloading Kafka..."
    if command -v curl &> /dev/null; then
        curl -s -L -o kafka_2.13-3.6.1.tgz https://downloads.apache.org/kafka/3.6.1/kafka_2.13-3.6.1.tgz
    elif command -v wget &> /dev/null; then
        wget -q https://downloads.apache.org/kafka/3.6.1/kafka_2.13-3.6.1.tgz
    else
        echo "❌ Neither curl nor wget found. Please:"
        echo "   1. Install curl: brew install curl"
        echo "   2. Or manually download from: https://downloads.apache.org/kafka/3.6.1/kafka_2.13-3.6.1.tgz"
        echo "   3. Place the file in this directory"
        echo "   4. Then extract: tar -xzf kafka_2.13-3.6.1.tgz"
        echo "   5. Run setup again"
        exit 1
    fi

    if [ -f "kafka_2.13-3.6.1.tgz" ]; then
        tar -xzf kafka_2.13-3.6.1.tgz
        echo "✅ Kafka downloaded and extracted"
    else
        echo "❌ Download failed. Please download manually from:"
        echo "   https://downloads.apache.org/kafka/3.6.1/kafka_2.13-3.6.1.tgz"
        exit 1
    fi
else
    echo "✅ Kafka already downloaded"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Setting up environment file..."
    cp config.env.example .env
    echo "✅ Created .env file from config.env.example"
else
    echo "✅ .env file already exists"
fi

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Open a new terminal and start Kafka:"
echo "   cd kafka_2.13-3.6.1"
echo "   bin/kafka-server-start.sh config/kraft/server.properties"
echo ""
echo "2. Wait for Kafka to show 'Kafka Server started' message"
echo ""
echo "3. In another terminal, start the application:"
echo "   npm start"
echo ""
echo "4. Test the API (in another terminal):"
echo "   curl http://localhost:3000/health"
echo ""
echo "5. Run consumer in another terminal:"
echo "   npm run consumer"
echo ""
echo "6. Test producer:"
echo "   npm run test"
echo ""
echo "Happy coding! 🎉"
