#!/bin/bash

# First try to read API key from .env file
if [ -f .env ]; then
  ENV_API_KEY=$(grep -v '^#' .env | grep 'ETHERSCAN_API_KEY=' | cut -d '=' -f2)
fi

# If command line argument is provided, it takes precedence
if [ ! -z "$1" ]; then
  echo "Using provided API key from command line argument"
  export ETHERSCAN_API_KEY="$1"
# If we found key in .env file, use that
elif [ ! -z "$ENV_API_KEY" ]; then
  echo "Using API key from .env file"
  export ETHERSCAN_API_KEY="$ENV_API_KEY"
# Fall back to default value if neither source is available
else
  echo "No API key found in .env or provided as argument, using default value"
  export ETHERSCAN_API_KEY="MCKBC5FEE3A8UDXEB1CXFFBPYN9AB2A4HY"
fi

echo "ETHERSCAN_API_KEY has been set"

# Run the application
node "$(dirname "$0")/build/index.js"
