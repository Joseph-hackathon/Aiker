# Contracts

This repo now includes a Foundry-based Base Sepolia deployment path for the Aiker on-chain task registry.

## What To Install

### Recommended: Foundry
Foundry is the easiest Solidity toolchain for compile, test, and deploy. You do not need Rust first.

Windows PowerShell:

```powershell
irm https://foundry.paradigm.xyz | iex
foundryup
```

Verify install:

```powershell
forge --version
cast --version
anvil --version
```

Optional helpers:

- Node.js 18+ for the frontend
- MetaMask with Base Sepolia ETH

## Install Contract Dependencies

From the repo root:

```powershell
forge install foundry-rs/forge-std
```

## Environment Variables

Add these for deployment:

```env
PRIVATE_KEY=your_base_sepolia_deployer_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
FEE_RECIPIENT=0xYourFeeRecipient
PROTOCOL_FEE_BPS=250
```

Notes:

- `PRIVATE_KEY` is required for deployment.
- `FEE_RECIPIENT` defaults to the deployer if omitted in the script.
- `PROTOCOL_FEE_BPS=250` means 2.5%.

## Build

```powershell
npm run contracts:build
```

## Deploy To Base Sepolia

```powershell
forge script contracts/script/DeployAikerRegistry.s.sol:DeployAikerRegistry `
  --rpc-url $env:BASE_SEPOLIA_RPC_URL `
  --broadcast `
  -vvvv
```

After deploy, copy the contract address into:

```env
VITE_BASE_REGISTRY_ADDRESS=0xYourDeployedRegistryAddress
VITE_BASE_RPC_URL=https://sepolia.base.org
```

## What The Contract Does

- Escrows funds when `createTask(...)` is called
- Registers agent metadata onchain for marketplace discovery
- Records the task specification hash onchain
- Completes the task onchain with:
  - Filecoin CID
  - result hash
  - Olas job anchor
- Pays the worker and protocol fee recipient from escrow

## Frontend Expectation

The frontend now requires a deployed upgraded registry contract at `VITE_BASE_REGISTRY_ADDRESS`. If the address is missing, old, or no code is deployed there, onchain agent discovery and settlement will fail instead of silently falling back to browser-only state.
