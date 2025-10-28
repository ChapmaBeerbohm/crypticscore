# 🔒 CrypticScore

> Privacy-preserving multi-dimensional rating system built on FHEVM technology

CrypticScore is a decentralized application that enables users to create and participate in rating projects while maintaining complete privacy of individual ratings through Fully Homomorphic Encryption (FHE). Built on the FHEVM blockchain, it allows aggregated statistical analysis without compromising user privacy.

## ✨ Features

- 🔐 **Fully Encrypted Ratings**: Individual ratings remain private on-chain using FHEVM encryption
- 📊 **Multi-Dimensional Analysis**: Support for custom rating dimensions (Quality, Service, Value, etc.)
- 📈 **Statistical Insights**: Decrypt aggregated statistics while preserving individual privacy
- 🌐 **Dual Network Support**: Works on both local development (Mock) and Sepolia testnet
- 🎨 **Modern UI**: Glassmorphism design with responsive layout and dark mode support

## 🏗️ Architecture

```
├── fhevm-hardhat-template/     # Smart contracts & deployment
│   ├── contracts/              # Solidity contracts
│   ├── deploy/                 # Deployment scripts
│   ├── tasks/                  # Hardhat tasks
│   └── test/                   # Contract tests
├── crypticscore-frontend/      # React/Next.js frontend
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── fhevm/                  # FHEVM integration
│   └── abi/                    # Generated contract ABIs
└── Fhevm0.8_Reference.md      # FHEVM documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask wallet
- Git

### 1. Clone & Install

```bash
git clone https://github.com/ChapmaBeerbohm/crypticscore.git
cd crypticscore

# Install contract dependencies
cd fhevm-hardhat-template
npm install

# Install frontend dependencies
cd ../crypticscore-frontend
npm install
```

### 2. Local Development

```bash
# Terminal 1: Start Hardhat node
cd fhevm-hardhat-template
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat deploy --network localhost

# Terminal 3: Start frontend
cd ../crypticscore-frontend
npm run dev:mock
```

Visit `http://localhost:3000`

### 3. Sepolia Testnet

```bash
# Configure environment
cd fhevm-hardhat-template
npx hardhat vars set MNEMONIC "your twelve word mnemonic"
npx hardhat vars set INFURA_API_KEY "your_infura_key"

# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Start frontend for testnet
cd ../crypticscore-frontend
npm run dev
```

## 📱 Usage

1. **Connect Wallet**: Link your MetaMask to localhost:8545 or Sepolia testnet
2. **Create Project**: Define rating dimensions and criteria
3. **Submit Ratings**: Participate in projects with encrypted ratings
4. **View Results**: Project creators can decrypt aggregated statistics
5. **Manage**: Track your created projects and participation history

## 🔧 Contract Addresses

- **Localhost**: `0xfc248842540C08e62785ce3bf80ceEc415f0EcaB`
- **Sepolia**: `0x433097721b74e4AcF48dDb6a407Fa4a0CFB8A94d`

## 🧪 Testing

```bash
cd fhevm-hardhat-template
npx hardhat test
```

## 🛠️ Available Scripts

### Contract Development
```bash
npm run compile        # Compile Solidity contracts
npm run test          # Run contract tests
npm run deploy:local  # Deploy to localhost
npm run deploy:sepolia # Deploy to Sepolia
```

### Frontend Development
```bash
npm run dev:mock      # Local development with Mock FHEVM
npm run dev           # Development with real FHEVM SDK
npm run build         # Production build
npm run genabi        # Generate ABI files from deployments
```

## 🔐 Privacy & Security

- **End-to-End Encryption**: Ratings are encrypted client-side before blockchain submission
- **Zero-Knowledge Privacy**: Individual ratings never appear in plaintext on-chain
- **Selective Decryption**: Only authorized parties can decrypt specific data
- **Audit Trail**: All operations are verifiable on the blockchain

## 🛡️ FHEVM Integration

CrypticScore leverages FHEVM's native capabilities:

- `euint32` encrypted integers for rating storage
- `FHE.fromExternal()` for encrypted input processing
- `FHE.allow()` for selective decryption authorization
- Dual SDK support: `@fhevm/mock-utils` (local) + `@zama-fhe/relayer-sdk` (testnet)

## 📊 Technology Stack

- **Blockchain**: FHEVM (Fully Homomorphic Encryption Virtual Machine)
- **Smart Contracts**: Solidity 0.8.27
- **Frontend**: React 18, Next.js 15, TypeScript
- **Styling**: Tailwind CSS with Glassmorphism design
- **Charts**: Chart.js with react-chartjs-2
- **Development**: Hardhat, Ethers.js v6

## 🌐 Network Support

| Network | Chain ID | Status | Contract Address |
|---------|----------|--------|------------------|
| Localhost | 31337 | ✅ Active | `0xfc2...caB` |
| Sepolia | 11155111 | ✅ Active | `0x433...94d` |

## 📝 Environment Variables

Create `.env` in `fhevm-hardhat-template/`:
```env
MNEMONIC="your twelve word seed phrase"
INFURA_API_KEY="your_infura_project_key"
ETHERSCAN_API_KEY="your_etherscan_key" # Optional for verification
```

Create `.env.local` in `crypticscore-frontend/`:
```env
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [FHEVM Docs](https://docs.fhevm.org/)
- **Sepolia Contract**: [0x433097721b74e4AcF48dDb6a407Fa4a0CFB8A94d](https://sepolia.etherscan.io/address/0x433097721b74e4AcF48dDb6a407Fa4a0CFB8A94d)

## ⚡ Performance

- **Gas Efficient**: Optimized contract deployment (~1.5M gas)
- **Fast Loading**: Next.js with static generation
- **Responsive**: Mobile-first design with Tailwind CSS
- **Real-time**: Instant feedback on blockchain interactions

---

Built with ❤️ using FHEVM technology for privacy-preserving applications.
