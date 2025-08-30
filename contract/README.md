# AttendX Smart Contracts

A blockchain-based attendance tracking system built on Lisk for fast, cost-effective, and transparent attendance management.

## 🏗️ Architecture

The AttendX smart contract system consists of several key components:

- **Session Management**: Create and manage attendance sessions
- **Student Registration**: Allow students to register for sessions
- **Check-in System**: Enable real-time attendance tracking
- **Verification**: Provide cryptographic proof of attendance
- **Analytics**: Generate attendance reports and statistics (to be advanced for the future)

## 📋 Contract Details

### Network Information
- **Blockchain**: Lisk Sepolia Testnet
- **Contract Address**: `0xf84fe45280161504B9e6EE321fF3b9492Cd0a70b`
- **Block Explorer**: [Lisk Sepolia Blockscout](https://sepolia-blockscout.lisk.com/)
- **Network RPC**: `https://rpc.sepolia-api.lisk.com`
- **Chain ID**: 4202

### Contract Features
- ✅ Session creation and management
- ✅ Student registration with wallet verification
- ✅ Real-time check-in tracking
- ✅ Attendance verification
- ✅ Event emission for frontend integration
- ✅ Role-based access control
- ✅ Gas-optimized operations

## 🚀 Getting Started

### Prerequisites

```bash
# Node.js and npm
node --version  # v18.0.0 or higher
npm --version   # v8.0.0 or higher

# Development tools
npm install -g hardhat
```

### Installation

```bash
# Clone the repository
git clone https://github.com/
cd attendx/contracts

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Lisk Sepolia Configuration
LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
PRIVATE_KEY=your_private_key_here

# Network Configuration
CHAIN_ID=4202
BLOCK_CONFIRMATIONS=6
```

## 🔧 Development

### Compiling Contracts

```bash
# Compile smart contracts
npx hardhat compile

# Clean and recompile
npx hardhat clean && npx hardhat compile
```

### Testing

```bash
# Run all tests
npm test

### Deployment

```bash
# Deploy to Lisk Sepolia
npx hardhat run scripts/deploy.js --network lisk-sepolia

# Verify contract on Blockscout
npx hardhat verify --network lisk-sepolia contract_address

## 📚 Contract API

### Core Functions

#### Session Management

### Useful Links

- **Faucet**: [Lisk Sepolia Faucet](https://app.lisk.com/faucet)
- **Bridge**: [Lisk Bridge](https://bridge.lisk.com/)
- **Documentation**: [Lisk Docs](https://docs.lisk.com/)
- **Status**: [Lisk Status](https://status.lisk.com/)

## 📊 Gas Optimization

### Estimated Gas Costs

| Function | Gas Cost (approx.) | USD Cost* |
|----------|-------------------|-----------|
| Create Session | 120,000 | $0.01 |
| Register for Session | 65,000 | $0.006 |
| Check In | 45,000 | $0.004 |
| Batch Check In (10) | 300,000 | $0.025 |

*Based on 20 gwei gas price and ETH at $2,000

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Implement your feature
5. Run the test suite (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Lisk Foundation** for the robust blockchain infrastructure
- **OpenZeppelin** for security-audited smart contract libraries
- **Hardhat** for the excellent development framework
- **Community** for continuous feedback and contributions

---

**Built with ❤️ on Lisk** | **Making Attendance Transparent and Immutable**