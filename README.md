# MCP Etherscan Server

An MCP (Model Context Protocol) server that provides Ethereum blockchain data tools via Etherscan's API. Features include checking ETH balances, viewing transaction history, tracking ERC20 transfers, fetching contract ABIs, monitoring gas prices, and resolving ENS names.

## Features

- **Balance Checking**: Get ETH balance for any Ethereum address
- **Transaction History**: View recent transactions with detailed information
- **Token Transfers**: Track ERC20 token transfers with token details
- **Contract ABI**: Fetch smart contract ABIs for development
- **Contract Code**: Fetch smart contract code for development
- **Gas Prices**: Monitor current gas prices (Safe Low, Standard, Fast)
- **ENS Resolution**: Resolve Ethereum addresses to ENS names

## Prerequisites

- Node.js >= 18
- An Etherscan API key (obtain one at https://etherscan.io/apis)

## Installation

1. Clone the repository:

```bash
git clone [your-repo-url]
cd mcp-etherscan-server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```bash
ETHERSCAN_API_KEY=your_api_key_here
```

4. Build the project:

```bash
npm run build
```

## Running the Server

Start the server:

```bash
npm start
```

The server runs on stdio, making it compatible with MCP clients like Cursor and Claude Desktop.

## How It Works

This server implements the Model Context Protocol (MCP) to provide tools for interacting with Ethereum blockchain data through Etherscan's API. Each tool is exposed as an MCP endpoint that can be called by compatible clients.

### Available Tools

1. `check-balance`

   - Input: Ethereum address
   - Output: ETH balance in both Wei and ETH

2. `get-transactions`

   - Input: Ethereum address, optional limit
   - Output: Recent transactions with timestamps, values, and addresses

3. `get-token-transfers`

   - Input: Ethereum address, optional limit
   - Output: Recent ERC20 token transfers with token details

4. `get-contract-abi`

   - Input: Contract address
   - Output: Contract ABI in JSON format

5. `get-contract-code`

   - Input: Contract address
   - Output: Contract code in string format

6. `get-gas-prices`

   - Input: None
   - Output: Current gas prices in Gwei

7. `get-ens-name`
   - Input: Ethereum address
   - Output: Associated ENS name if available

## Using with Cursor

To add this server to Cursor:

1. Open `Cursor` and go to `Cursor settings` -> `MCP`
2. Select the option to either add the MCP Server `locally` or `globally`, which will open a JSON configuration file.

3. Add the configuration details. You can either add the MCP server via Smithery or via this repo locally:

   ### Smithery

   #### Using smithery.ai (This step requires a smithery.ai account)
   1. Navigate to this URL in your web browser: https://smithery.ai/server/@ThirdGuard/mcp-etherscan-server

   2. Enter your Etherscan API key in the field `etherscanApiKey` and click the `connect` button

   3. Navigate to the `Cursor` tab, copy the command, and run it in your terminal.

   #### Manual

   Paste the following configuration in the JSON file and replace `ETHERSCAN-API-KEY-HERE` with your Etherscan API key:

   ```json
   {
     "Etherscan Tools": {
       "command": "npx",
       "args": [
         "-y",
         "@smithery/cli@latest",
         "run",
         "@ThirdGuard/mcp-etherscan-server",
         "--config",
         "\"{\\\"etherscanApiKey\\\":\\\"ETHERSCAN-API-KEY-HERE\\\"}\""
       ]
     }
   }
   ```

   ### Local

   Paste the following configuration in the JSON file and replace `ABSOLUTE-PATH-HERE/mcp-etherscan-server/start.sh` with the absolute path to the `start.sh` in this repo:

   ```json
   {
     "Etherscan Tools (local)": {
       "command": "ABSOLUTE-PATH-HERE/mcp-etherscan-server/start.sh",
       "args": []
     }
   }
   ```

4. Save the configuration
5. The Etherscan tools will now be available in your Cursor AI conversations

### Example Usage in Cursor

You can use commands like:

```
Check the balance of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

or

```
Get the code of this smart contract: 0xdAC17F958D2ee523a2206206994597C13D831ec7 (USDT)
```

## Development

To add new features or modify existing ones:

1. The main server logic is in `src/server.ts`
2. Etherscan API interactions are handled in `src/services/etherscanService.ts`
3. Run `npm run build` after making changes

## License

MIT License - See LICENSE file for details
