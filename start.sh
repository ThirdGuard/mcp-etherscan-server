#!/bin/bash

# Set environment variable for Etherscan API key
# You can replace the example value with your actual API key
# or pass it as an argument when running the script

if [ -z "$1" ]; then
  echo "No API key provided as argument, using default value"
  export ETHERSCAN_API_KEY="MCKBC5FEE3A8UDXEB1CXFFBPYN9AB2A4HY"
else
  echo "Using provided API key"
  export ETHERSCAN_API_KEY="$1"
fi

echo "ETHERSCAN_API_KEY has been set"

# Run the application
node "$(dirname "$0")/build/index.js"
