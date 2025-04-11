import { Contract, Provider, ethers } from "ethers";

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
}

export interface TokenTransfer {
  token: string;
  tokenName: string;
  tokenSymbol: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
}

export interface GasPrice {
  safeGwei: string;
  proposeGwei: string;
  fastGwei: string;
}

export class EtherscanService {
  private provider: ethers.EtherscanProvider;

  constructor(apiKey: string) {
    this.provider = new ethers.EtherscanProvider("mainnet", apiKey);
  }

  async getAddressBalance(address: string): Promise<{
    address: string;
    balanceInWei: bigint;
    balanceInEth: string;
  }> {
    try {
      // Validate the address
      const validAddress = ethers.getAddress(address);

      // Get balance in Wei
      const balanceInWei = await this.provider.getBalance(validAddress);

      // Convert to ETH
      const balanceInEth = ethers.formatEther(balanceInWei);

      return {
        address: validAddress,
        balanceInWei,
        balanceInEth,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get balance: ${error.message}`);
      }
      throw error;
    }
  }

  async getTransactionHistory(
    address: string,
    limit: number = 10
  ): Promise<Transaction[]> {
    try {
      // Validate the address
      const validAddress = ethers.getAddress(address);

      // Get transactions directly from Etherscan API
      const result = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${validAddress}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${this.provider.apiKey}`
      );

      const data = await result.json();

      if (data.status !== "1" || !data.result) {
        throw new Error(data.message || "Failed to fetch transactions");
      }

      // Format the results
      return data.result.slice(0, limit).map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to || "Contract Creation",
        value: ethers.formatEther(tx.value),
        timestamp: parseInt(tx.timeStamp) || 0,
        blockNumber: parseInt(tx.blockNumber) || 0,
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get transaction history: ${error.message}`);
      }
      throw error;
    }
  }

  async getTokenTransfers(
    address: string,
    limit: number = 10
  ): Promise<TokenTransfer[]> {
    try {
      const validAddress = ethers.getAddress(address);

      // Get ERC20 token transfers
      const result = await fetch(
        `https://api.etherscan.io/api?module=account&action=tokentx&address=${validAddress}&page=1&offset=${limit}&sort=desc&apikey=${this.provider.apiKey}`
      );

      const data = await result.json();

      if (data.status !== "1" || !data.result) {
        throw new Error(data.message || "Failed to fetch token transfers");
      }

      // Format the results
      return data.result.slice(0, limit).map((tx: any) => ({
        token: tx.contractAddress,
        tokenName: tx.tokenName,
        tokenSymbol: tx.tokenSymbol,
        from: tx.from,
        to: tx.to,
        value: ethers.formatUnits(tx.value, parseInt(tx.tokenDecimal)),
        timestamp: parseInt(tx.timeStamp) || 0,
        blockNumber: parseInt(tx.blockNumber) || 0,
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get token transfers: ${error.message}`);
      }
      throw error;
    }
  }

  async getContractABI(address: string): Promise<string> {
    try {
      let abi = await fetchContractABI(address, this.provider.apiKey!);

      // Check if the contract is a proxy
      const implementationAddress = await getImplementationAddress(
        address,
        abi,
        this.provider
      );

      if (implementationAddress) {
        abi = await fetchContractABI(
          implementationAddress,
          this.provider.apiKey!
        );

        return abi;
      }

      return abi;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get contract ABI: ${error.message}`);
      }
      throw error;
    }
  }

  async getGasOracle(): Promise<GasPrice> {
    try {
      // Get current gas prices
      const result = await fetch(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${this.provider.apiKey}`
      );

      const data = await result.json();

      if (data.status !== "1" || !data.result) {
        throw new Error(data.message || "Failed to fetch gas prices");
      }

      return {
        safeGwei: data.result.SafeGasPrice,
        proposeGwei: data.result.ProposeGasPrice,
        fastGwei: data.result.FastGasPrice,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get gas prices: ${error.message}`);
      }
      throw error;
    }
  }

  async getENSName(address: string): Promise<string | null> {
    try {
      const validAddress = ethers.getAddress(address);
      return await this.provider.lookupAddress(validAddress);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get ENS name: ${error.message}`);
      }
      throw error;
    }
  }

  async getContractCode(address: string): Promise<string> {
    try {
      const validAddress = ethers.getAddress(address);

      const result = await fetch(
        `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${validAddress}&apikey=${this.provider.apiKey}`
      );
      const data = await result.json();

      if (data.status !== "1" || !data.result) {
        throw new Error(data.message || "Failed to fetch contract code");
      }

      return data.result[0].SourceCode;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get contract code: ${error.message}`);
      }
      throw error;
    }
  }
}

export async function fetchABIFromSourcify(address: string): Promise<string> {
  const url = `https://repo.sourcify.dev/contracts/full_match/1/${address}/metadata.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return JSON.stringify(data.output.abi);
  } catch (error) {
    throw new Error(
      `Failed to fetch ABI from Sourcify: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Checks if a contract is a proxy and returns the implementation address.
 * Handles multiple common proxy patterns.
 */
async function getImplementationAddress(
  address: string,
  abi: string,
  provider: Provider
): Promise<string | null> {
  const contract = new Contract(address, abi, provider);

  // List of common implementation function names
  const implementationFunctionNames = [
    "implementation", // Standard OpenZeppelin proxy
    "_implementation", // Some proxies use this
    "getImplementation", // Some proxies use this
    "getImplementationAddress", // Some proxies use this
  ];

  for (const functionName of implementationFunctionNames) {
    try {
      // Check if the contract has the function
      if (contract.interface.getFunction(functionName)) {
        const implementationAddress = await contract[functionName]();
        if (implementationAddress && implementationAddress.length === 42) {
          return implementationAddress;
        }
      }
    } catch (error) {
      console.warn(
        `Failed to call ${functionName} on contract:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.warn(
    "No implementation address found. The contract may not be a proxy or uses a non-standard pattern."
  );
  return null;
}

export async function fetchContractABI(
  address: string,
  etherscanApiKey: string
): Promise<string> {
  try {
    // First try to get ABI from Sourcify
    try {
      return await fetchABIFromSourcify(address);
    } catch (error) {
      // If Sourcify fails, try Etherscan
      const validAddress = ethers.getAddress(address);

      // Get contract ABI from Etherscan using fetch
      const response = await fetch(
        `https://api.etherscan.io/api?module=contract&action=getabi&address=${validAddress}&apikey=${etherscanApiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "1" || !data.result) {
        throw new Error(
          data.message || "Failed to fetch contract ABI from Etherscan"
        );
      }

      return data.result;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get contract ABI: ${error.message}`);
    }
    throw error;
  }
}
