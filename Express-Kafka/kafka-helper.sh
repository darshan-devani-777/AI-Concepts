#!/bin/bash

echo "🔧 Kafka Helper Script"
echo "======================"

KAFKA_DIR="./kafka_2.13-3.6.1"
KAFKA_CONFIG="$KAFKA_DIR/config/kraft/server.properties"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ "$1" = "start" ]; then
    echo "Starting Kafka..."

    if [ ! -d "$KAFKA_DIR" ]; then
        echo -e "${RED}Error: Kafka directory not found at $KAFKA_DIR${NC}"
        echo -e "${YELLOW}Please either:${NC}"
        echo -e "${YELLOW}  1. Run ./setup.sh to download Kafka automatically${NC}"
        echo -e "${YELLOW}  2. Or manually download from: https://downloads.apache.org/kafka/3.6.1/kafka_2.13-3.6.1.tgz${NC}"
        echo -e "${YELLOW}  3. Extract it: tar -xzf kafka_2.13-3.6.1.tgz${NC}"
        exit 1
    fi

    cd "$KAFKA_DIR"

    # Check if cluster is already formatted
    if [ ! -f "meta.properties" ]; then
        echo -e "${YELLOW}First time setup: Generating cluster ID...${NC}"
        CLUSTER_ID=$(bin/kafka-storage.sh random-uuid)
        echo -e "${GREEN}Cluster ID: $CLUSTER_ID${NC}"

        echo -e "${YELLOW}Formatting storage...${NC}"
        bin/kafka-storage.sh format -t "$CLUSTER_ID" -c config/kraft/server.properties
    else
        echo -e "${GREEN}Cluster already formatted${NC}"
    fi

    echo -e "${GREEN}Starting Kafka server...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop Kafka${NC}"
    bin/kafka-server-start.sh config/kraft/server.properties

elif [ "$1" = "status" ]; then
    echo "Checking Kafka status..."

    if nc -z localhost 9092 2>/dev/null; then
        echo -e "${GREEN}✅ Kafka is running on port 9092${NC}"

        # Try to list topics
        cd "$KAFKA_DIR" 2>/dev/null
        if [ -d "$KAFKA_DIR" ]; then
            TOPICS=$(bin/kafka-topics.sh --list --bootstrap-server localhost:9092 2>/dev/null)
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}📋 Topics: ${NC}$(echo "$TOPICS" | wc -l) found"
                echo "$TOPICS" | head -5
                if [ $(echo "$TOPICS" | wc -l) -gt 5 ]; then
                    echo "..."
                fi
            fi
        fi
    else
        echo -e "${RED}❌ Kafka is not running on port 9092${NC}"
        echo -e "${YELLOW}💡 Start Kafka with: ./kafka-helper.sh start${NC}"
    fi

elif [ "$1" = "topics" ]; then
    echo "Listing Kafka topics..."

    if ! nc -z localhost 9092 2>/dev/null; then
        echo -e "${RED}❌ Kafka is not running${NC}"
        exit 1
    fi

    cd "$KAFKA_DIR"
    bin/kafka-topics.sh --list --bootstrap-server localhost:9092

elif [ "$1" = "create-topics" ]; then
    echo "Creating default topics..."

    if ! nc -z localhost 9092 2>/dev/null; then
        echo -e "${RED}❌ Kafka is not running${NC}"
        exit 1
    fi

    cd "$KAFKA_DIR"
    bin/kafka-topics.sh --create --topic messages --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 2>/dev/null && echo -e "${GREEN}✅ Created topic: messages${NC}" || echo -e "${YELLOW}⚠️  Topic 'messages' already exists${NC}"
    bin/kafka-topics.sh --create --topic notifications --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 2>/dev/null && echo -e "${GREEN}✅ Created topic: notifications${NC}" || echo -e "${YELLOW}⚠️  Topic 'notifications' already exists${NC}"

elif [ "$1" = "consume" ]; then
    echo "Consuming messages from topics..."

    if ! nc -z localhost 9092 2>/dev/null; then
        echo -e "${RED}❌ Kafka is not running${NC}"
        exit 1
    fi

    cd "$KAFKA_DIR"
    echo -e "${YELLOW}Starting consumer... Press Ctrl+C to stop${NC}"
    echo -e "${YELLOW}This will show all messages from the beginning${NC}"
    bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic messages --from-beginning --property print.key=true --property key.separator=" | "

elif [ "$1" = "consume-notifications" ]; then
    echo "Consuming notifications from topics..."

    if ! nc -z localhost 9092 2>/dev/null; then
        echo -e "${RED}❌ Kafka is not running${NC}"
        exit 1
    fi

    cd "$KAFKA_DIR"
    echo -e "${YELLOW}Starting consumer for notifications... Press Ctrl+C to stop${NC}"
    bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic notifications --from-beginning --property print.key=true --property key.separator=" | "

elif [ "$1" = "logs" ]; then
    echo "Checking Kafka logs..."
    echo -e "${YELLOW}Note: Kafka logs are shown in the terminal where Kafka is running${NC}"
    echo -e "${YELLOW}If Kafka was started in background, check the process${NC}"

else
    echo "Usage: $0 {start|status|topics|create-topics|consume|consume-notifications|logs}"
    echo ""
    echo "Commands:"
    echo "  start                 - Start Kafka server"
    echo "  status                - Check if Kafka is running and show topics"
    echo "  topics                - List all Kafka topics"
    echo "  create-topics         - Create default topics (messages, notifications)"
    echo "  consume               - Consume and display all messages from 'messages' topic"
    echo "  consume-notifications - Consume and display all notifications from 'notifications' topic"
    echo "  logs                  - Show info about Kafka logs"
    echo ""
    echo "Examples:"
    echo "  ./kafka-helper.sh start"
    echo "  ./kafka-helper.sh status"
    echo "  ./kafka-helper.sh create-topics"
    echo "  ./kafka-helper.sh consume"
    echo "  ./kafka-helper.sh consume-notifications"
fi
