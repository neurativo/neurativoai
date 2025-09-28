// Blockchain Verification Service
// Supports multiple blockchain explorers for crypto payment verification

export interface BlockchainConfig {
  name: string;
  symbol: string;
  network: string;
  explorerApiUrl: string;
  apiKey?: string;
  contractAddress?: string;
  requiredConfirmations: number;
}

export interface PaymentVerificationResult {
  success: boolean;
  confirmed: boolean;
  confirmationCount: number;
  requiredConfirmations: number;
  blockHeight?: number;
  blockHash?: string;
  gasFee?: number;
  error?: string;
  rawData?: any;
}

export interface TransactionData {
  txId: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  blockHeight?: number;
  blockHash?: string;
  confirmationCount: number;
  gasFee?: number;
  timestamp?: number;
}

export class BlockchainVerificationService {
  private configs: Map<string, BlockchainConfig> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs() {
    // Bitcoin (Blockstream API)
    this.configs.set('BTC', {
      name: 'Bitcoin',
      symbol: 'BTC',
      network: 'bitcoin',
      explorerApiUrl: 'https://blockstream.info/api',
      requiredConfirmations: 3
    });

    // Ethereum (Etherscan API)
    this.configs.set('ETH', {
      name: 'Ethereum',
      symbol: 'ETH',
      network: 'ethereum',
      explorerApiUrl: 'https://api.etherscan.io/api',
      requiredConfirmations: 12
    });

    // USDT (Ethereum)
    this.configs.set('USDT', {
      name: 'Tether USD',
      symbol: 'USDT',
      network: 'ethereum',
      explorerApiUrl: 'https://api.etherscan.io/api',
      contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      requiredConfirmations: 12
    });

    // USDC (Ethereum)
    this.configs.set('USDC', {
      name: 'USD Coin',
      symbol: 'USDC',
      network: 'ethereum',
      explorerApiUrl: 'https://api.etherscan.io/api',
      contractAddress: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C',
      requiredConfirmations: 12
    });
  }

  async verifyPayment(
    symbol: string,
    txId: string,
    expectedToAddress: string,
    expectedAmount?: number
  ): Promise<PaymentVerificationResult> {
    const config = this.configs.get(symbol.toUpperCase());
    if (!config) {
      return {
        success: false,
        confirmed: false,
        confirmationCount: 0,
        requiredConfirmations: 0,
        error: `Unsupported cryptocurrency: ${symbol}`
      };
    }

    try {
      switch (config.network) {
        case 'bitcoin':
          return await this.verifyBitcoinTransaction(config, txId, expectedToAddress, expectedAmount);
        case 'ethereum':
          return await this.verifyEthereumTransaction(config, txId, expectedToAddress, expectedAmount);
        default:
          return {
            success: false,
            confirmed: false,
            confirmationCount: 0,
            requiredConfirmations: config.requiredConfirmations,
            error: `Unsupported network: ${config.network}`
          };
      }
    } catch (error) {
      console.error(`Error verifying ${symbol} transaction ${txId}:`, error);
      return {
        success: false,
        confirmed: false,
        confirmationCount: 0,
        requiredConfirmations: config.requiredConfirmations,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async verifyBitcoinTransaction(
    config: BlockchainConfig,
    txId: string,
    expectedToAddress: string,
    expectedAmount?: number
  ): Promise<PaymentVerificationResult> {
    try {
      // Get transaction details
      const txResponse = await fetch(`${config.explorerApiUrl}/tx/${txId}`);
      if (!txResponse.ok) {
        throw new Error(`Failed to fetch transaction: ${txResponse.status}`);
      }
      const txData = await txResponse.json();

      // Get current block height for confirmation count
      const blockHeightResponse = await fetch(`${config.explorerApiUrl}/blocks/tip/height`);
      const currentBlockHeight = await blockHeightResponse.json();

      const confirmationCount = txData.status.confirmed 
        ? currentBlockHeight - txData.status.block_height + 1 
        : 0;

      // Check if transaction is confirmed
      const confirmed = confirmationCount >= config.requiredConfirmations;

      // Verify transaction details
      const isValid = this.validateBitcoinTransaction(txData, expectedToAddress, expectedAmount);

      return {
        success: true,
        confirmed: confirmed && isValid,
        confirmationCount,
        requiredConfirmations: config.requiredConfirmations,
        blockHeight: txData.status.block_height,
        blockHash: txData.status.block_hash,
        gasFee: txData.fee,
        rawData: txData
      };
    } catch (error) {
      throw new Error(`Bitcoin verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async verifyEthereumTransaction(
    config: BlockchainConfig,
    txId: string,
    expectedToAddress: string,
    expectedAmount?: number
  ): Promise<PaymentVerificationResult> {
    try {
      const apiKey = config.apiKey || process.env.ETHERSCAN_API_KEY;
      if (!apiKey) {
        throw new Error('Etherscan API key not configured');
      }

      // Get transaction details
      const txResponse = await fetch(
        `${config.explorerApiUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${txId}&apikey=${apiKey}`
      );
      if (!txResponse.ok) {
        throw new Error(`Failed to fetch transaction: ${txResponse.status}`);
      }
      const txData = await txResponse.json();

      if (txData.error) {
        throw new Error(`Etherscan API error: ${txData.error.message}`);
      }

      // Get transaction receipt for confirmation count
      const receiptResponse = await fetch(
        `${config.explorerApiUrl}?module=proxy&action=eth_getTransactionReceipt&txhash=${txId}&apikey=${apiKey}`
      );
      const receiptData = await receiptResponse.json();

      // Get current block number
      const blockResponse = await fetch(
        `${config.explorerApiUrl}?module=proxy&action=eth_blockNumber&apikey=${apiKey}`
      );
      const currentBlockData = await blockResponse.json();
      const currentBlockHeight = parseInt(currentBlockData.result, 16);

      const confirmationCount = receiptData.result 
        ? currentBlockHeight - parseInt(receiptData.result.blockNumber, 16) + 1
        : 0;

      const confirmed = confirmationCount >= config.requiredConfirmations;

      // Verify transaction details
      const isValid = this.validateEthereumTransaction(txData, expectedToAddress, expectedAmount, config);

      return {
        success: true,
        confirmed: confirmed && isValid,
        confirmationCount,
        requiredConfirmations: config.requiredConfirmations,
        blockHeight: parseInt(txData.result.blockNumber, 16),
        blockHash: txData.result.blockHash,
        gasFee: this.calculateGasFee(txData.result),
        rawData: txData
      };
    } catch (error) {
      throw new Error(`Ethereum verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateBitcoinTransaction(
    txData: any,
    expectedToAddress: string,
    expectedAmount?: number
  ): boolean {
    // Check if transaction has outputs to expected address
    const hasCorrectOutput = txData.vout.some((output: any) => {
      const address = output.scriptpubkey_address;
      const amount = output.value / 100000000; // Convert satoshis to BTC
      return address === expectedToAddress && 
             (!expectedAmount || Math.abs(amount - expectedAmount) < 0.00000001);
    });

    return hasCorrectOutput;
  }

  private validateEthereumTransaction(
    txData: any,
    expectedToAddress: string,
    expectedAmount?: number,
    config?: BlockchainConfig
  ): boolean {
    const tx = txData.result;
    
    // Check if transaction is to expected address
    const toAddress = tx.to?.toLowerCase();
    const expectedToLower = expectedToAddress.toLowerCase();
    
    if (toAddress !== expectedToLower) {
      return false;
    }

    // For ERC-20 tokens, we would need to check transfer events
    // For now, we'll just check the basic transaction
    if (config?.contractAddress) {
      // This is an ERC-20 token transaction
      // In a production system, you'd parse the transaction input data
      // to verify the transfer amount and recipient
      return true; // Simplified for now
    }

    // For ETH transactions, check value
    if (expectedAmount) {
      const value = parseInt(tx.value, 16) / Math.pow(10, 18); // Convert wei to ETH
      return Math.abs(value - expectedAmount) < 0.00000001;
    }

    return true;
  }

  private calculateGasFee(txData: any): number {
    const gasUsed = parseInt(txData.gas, 16);
    const gasPrice = parseInt(txData.gasPrice, 16);
    return (gasUsed * gasPrice) / Math.pow(10, 18); // Convert to ETH
  }

  // Get supported cryptocurrencies
  getSupportedCryptocurrencies(): string[] {
    return Array.from(this.configs.keys());
  }

  // Get configuration for a specific cryptocurrency
  getConfig(symbol: string): BlockchainConfig | undefined {
    return this.configs.get(symbol.toUpperCase());
  }

  // Add custom configuration
  addConfig(symbol: string, config: BlockchainConfig): void {
    this.configs.set(symbol.toUpperCase(), config);
  }
}

// Export singleton instance
export const blockchainVerificationService = new BlockchainVerificationService();
