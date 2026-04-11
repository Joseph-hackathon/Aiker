import {
    Asset,
    Horizon,
    Networks,
    Operation,
    Transaction,
    TransactionBuilder,
} from '@stellar/stellar-sdk';
import axios from 'axios';
import { getFreighterPublicKey, signStellarTransaction } from '../utils/stellar-wallet';

const STELLAR_HORIZON_URL = "https://horizon-testnet.stellar.org";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"; // Correct Testnet USDC Issuer
const USDC_ASSET = new Asset("USDC", USDC_ISSUER);

const REQUEST_TIMEOUT_MS = 60_000;

export interface OnchainAgent {
    agentId: number;
    creator: string;
    payoutAddress: string;
    price: string;
    asset: string; // "XLM" or "USDC"
    completedTasks: number;
    name: string;
    category: string;
    description: string;
    apiEndpoint: string;
    network: string;
    traits: string[];
    active: boolean;
    createdAt: number;
}

export interface OnchainTask {
    id: string;
    taskId: number;
    agentId: number;
    agentName: string;
    creator: string;
    worker: string;
    price: string;
    asset: string;
    proofCid: string;
    status: number;
    createdAt: number;
    completedAt: number;
    timestamp: string;
}

export interface AgentTaskBrief {
    objective: string;
    context: string;
    requestedOutput: string;
    urls: string[];
    attachments: any[];
}

export interface AgentConversationMessage {
    role: "user" | "assistant";
    content: string;
}

export interface AgentExecutionRequest {
    agentId: number;
    agentName: string;
    agentDescription: string;
    apiEndpoint: string;
    price: string;
    asset: string;
    taskBrief: AgentTaskBrief;
    conversation: AgentConversationMessage[];
}

export interface AgentExecutionResult {
    output: string;
    summary?: string;
    metadata?: Record<string, unknown>;
}

// Mock data for initial development - will be replaced by Soroban calls
const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.startsWith('192.168.'));

const REGISTRY_STORAGE_KEY = 'aiker_onchain_agent_registry';

/**
 * Resolves an agent API endpoint by applying local proxy paths if in development mode.
 */
const resolveAgentEndpoint = (url: string): string => {
    if (!isLocal) return url;
    
    // Auto-resolve known Vercel domains to local proxy paths
    if (url.includes('aiker-agent-lumen-scout.vercel.app')) {
        return url.replace('https://aiker-agent-lumen-scout.vercel.app', '/api-lumen');
    }
    if (url.includes('aiker-agent-stripe-settle.vercel.app')) {
        return url.replace('https://aiker-agent-stripe-settle.vercel.app', '/api-stripe');
    }
    if (url.includes('aiker-agent-orbit.vercel.app')) {
        return url.replace('https://aiker-agent-orbit.vercel.app', '/api-orbit');
    }
    
    return url;
};

const MOCK_AGENTS: OnchainAgent[] = [
    {
        agentId: 1,
        name: "Lumen Scout",
        category: "Analytics",
        description: "Specialized in Stellar network analysis and yield optimization strategies.",
        price: "5.0",
        asset: "XLM",
        payoutAddress: "GD...1",
        creator: "GD...1",
        completedTasks: 12,
        apiEndpoint: "https://aiker-agent-lumen-scout.vercel.app/api/execute",
        network: "Stellar Testnet",
        traits: ["Reliable", "Fast", "On-chain Expert"],
        active: true,
        createdAt: Date.now() / 1000,
    },
    {
        agentId: 2,
        name: "Stripe Settle",
        category: "Automation",
        description: "Autonomous payment processor using Stripe MPP for session management.",
        price: "1.5",
        asset: "USDC",
        payoutAddress: "GD...2",
        creator: "GD...2",
        completedTasks: 45,
        apiEndpoint: "https://aiker-agent-stripe-settle.vercel.app/api/execute",
        network: "Stellar Testnet",
        traits: ["Secure", "Compliant", "Multi-asset"],
        active: true,
        createdAt: Date.now() / 1000,
    },
    {
        agentId: 3,
        name: "Orbit Researcher",
        category: "Research",
        description: "Deep-dive researcher for the agentic economy using X402 paywalls.",
        price: "10.0",
        asset: "XLM",
        payoutAddress: "GD...3",
        creator: "GD...3",
        completedTasks: 8,
        apiEndpoint: "https://aiker-agent-orbit.vercel.app/api/execute",
        network: "Stellar Testnet",
        traits: ["Insightful", "Detail-oriented", "Verifiable"],
        active: true,
        createdAt: Date.now() / 1000,
    }
];

export const fetchOnchainAgents = async (): Promise<OnchainAgent[]> => {
    // 1. Get static mock agents
    const agents = [...MOCK_AGENTS];
    
    // 2. Load persistent agents from localStorage (simulating a Soroban state indexer)
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(REGISTRY_STORAGE_KEY);
            if (stored) {
                const registeredAgents: OnchainAgent[] = JSON.parse(stored);
                return [...agents, ...registeredAgents];
            }
        } catch (error) {
            console.error('Failed to parse local agent registry', error);
        }
    }
    
    return agents;
};

export const executeAgentWithX402 = async (request: AgentExecutionRequest): Promise<AgentExecutionResult> => {
    const apiEndpoint = resolveAgentEndpoint(request.apiEndpoint);
    console.log(`[X402] Executing ${request.agentName} via ${apiEndpoint}...`);
    
    try {
        const response = await axios.post(apiEndpoint, {
            protocol: "aiker.agent-job.v2",
            agent: {
                id: request.agentId,
                name: request.agentName,
            },
            task: request.taskBrief,
            conversation: request.conversation,
        }, { timeout: REQUEST_TIMEOUT_MS });

        return response.data;
    } catch (error: any) {
        if (error.response?.status === 402) {
            console.log("[X402] 402 Payment Required detected. Initiating Stellar payment...");
            const amount = error.response.headers['x-stellar-payment-amount'] || request.price;
            const destination = error.response.headers['x-stellar-payment-destination'] || "GD...DEST"; // In real scenario, dynamic
            
            // Handle Stellar Payment
            const txHash = await performStellarPayment(destination, amount, request.asset);
            
            // Retry with proof
            console.log("[X402] Payment settled. Retrying request with proof:", txHash);
            const retryResponse = await axios.post(apiEndpoint, {
                protocol: "aiker.agent-job.v2",
                agent: { id: request.agentId, name: request.agentName },
                task: request.taskBrief,
                conversation: request.conversation,
                paymentProof: txHash,
            }, { timeout: REQUEST_TIMEOUT_MS });
            
            return retryResponse.data;
        }
        throw error;
    }
};

const performStellarPayment = async (destination: string, amount: string, assetType: string): Promise<string> => {
    const publicKey = await getFreighterPublicKey();
    if (!publicKey) throw new Error("Stellar wallet not connected.");

    const server = new Horizon.Server(STELLAR_HORIZON_URL);
    const account = await server.loadAccount(publicKey);
    
    const asset = assetType === "USDC" ? USDC_ASSET : Asset.native();
    
    const tx = new TransactionBuilder(account, {
        fee: "1000",
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(Operation.payment({
        destination,
        asset,
        amount,
    }))
    .setTimeout(60)
    .build();

    const xdr = tx.toXDR();
    const signedXdr = await signStellarTransaction(xdr, "TESTNET");
    
    if (!signedXdr) throw new Error("Payment signature rejected.");
    
    const signedTransaction = new Transaction(signedXdr, Networks.TESTNET);
    const result = await server.submitTransaction(signedTransaction);
    return result.hash;
};

export const settleOnStellar = async (
    agentId: number,
    agentName: string
): Promise<{ txHash: string; taskId: number }> => {
    console.log(`[STELLAR] Settling task for ${agentName} on Soroban...`);
    
    // In a final version, this would be a Soroban contract call to record the task
    // For now, we perform a record-keeping transaction on Stellar Testnet
    const publicKey = await getFreighterPublicKey();
    if (!publicKey) throw new Error("Wallet not connected.");

    const server = new Horizon.Server(STELLAR_HORIZON_URL);
    const account = await server.loadAccount(publicKey);

    // Dummy memo to store "proof" of settlement for the hackathon
    const memo = `aiker:${agentId}:${Date.now().toString().slice(-8)}`;
    
    const tx = new TransactionBuilder(account, {
        fee: "1000",
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(Operation.manageData({
        name: "AikerTask",
        value: Buffer.from(memo),
    }))
    .setTimeout(60)
    .build();

    const signedXdr = await signStellarTransaction(tx.toXDR(), "TESTNET");
    if (!signedXdr) throw new Error("Settlement signature rejected.");

    const signedTransaction = new Transaction(signedXdr, Networks.TESTNET);
    const result = await server.submitTransaction(signedTransaction);
    
    return {
        txHash: result.hash,
        taskId: Math.floor(Math.random() * 1000000),
    };
};

export const registerAgentOnStellar = async (agentData: any): Promise<{ txHash: string; agentId: number }> => {
    console.log(`[STELLAR] Registering agent ${agentData.name} on Stellar...`);
    
    const publicKey = await getFreighterPublicKey();
    if (!publicKey) throw new Error("Stellar wallet not connected.");

    const server = new Horizon.Server(STELLAR_HORIZON_URL);
    const account = await server.loadAccount(publicKey);

    const memo = `aiker:reg:${agentData.name.slice(0, 10)}`;
    
    const tx = new TransactionBuilder(account, {
        fee: "1000",
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(Operation.manageData({
        name: "AikerReg",
        value: Buffer.from(memo),
    }))
    .setTimeout(60)
    .build();

    const signedXdr = await signStellarTransaction(tx.toXDR(), "TESTNET");
    if (!signedXdr) throw new Error("Registration signature rejected.");

    const signedTransaction = new Transaction(signedXdr, Networks.TESTNET);
    const result = await server.submitTransaction(signedTransaction);
    
    const agentId = Math.floor(Math.random() * 5000) + 100;
    
    // Persist metadata locally for the demo session (Real data simulation)
    if (typeof window !== 'undefined') {
        const newAgent: OnchainAgent = {
            agentId,
            name: agentData.name,
            category: agentData.category,
            description: agentData.description,
            price: agentData.price,
            asset: agentData.asset,
            payoutAddress: agentData.payoutAddress,
            creator: publicKey, // The user who registered it
            completedTasks: 0,
            apiEndpoint: agentData.apiEndpoint,
            network: "Stellar Testnet",
            traits: agentData.traits || [],
            active: true,
            createdAt: Date.now() / 1000,
        };

        try {
            const stored = localStorage.getItem(REGISTRY_STORAGE_KEY);
            const registry = stored ? JSON.parse(stored) : [];
            registry.push(newAgent);
            localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
        } catch (error) {
            console.error('Failed to save agent to local registry', error);
        }
    }

    return {
        txHash: result.hash,
        agentId,
    };
};

export const fetchAccountActivity = async (address: string): Promise<OnchainTask[]> => {
    console.log(`[STELLAR] Fetching activity for ${address}...`);
    // Placeholder for real Horizon history scan
    return [];
};
