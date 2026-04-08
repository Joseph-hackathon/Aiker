import { useStellarWallet } from '../context/StellarWalletContext';
import { Activity, Clock, CheckCircle2, ArrowLeft, ShieldCheck, Zap, CreditCard, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchOnchainAgents, type OnchainAgent, type OnchainTask } from '../services/bounty';

type AgentActivity = {
    id: string;
    type: 'agent';
    agentId: number;
    name: string;
    price: string;
    asset: string;
    timestamp: string;
};

type DashboardItem = OnchainTask | AgentActivity;

const isOnchainTask = (item: DashboardItem): item is OnchainTask => {
    return 'taskId' in item;
};

const Dashboard = () => {
    const { isInitializing, address, lastKnownAddress, network } = useStellarWallet();
    const [history, setHistory] = useState<DashboardItem[]>([]);
    const [isRegistryLive, setIsRegistryLive] = useState<boolean | null>(null);
    const [agentCount, setAgentCount] = useState(0);

    useEffect(() => {
        const loadDashboard = async () => {
            const targetAddress = address || lastKnownAddress;
            if (!targetAddress) return;

            try {
                // In a real Soroban app, we'd check contract existence here
                setIsRegistryLive(true);

                const agents = await fetchOnchainAgents();
                
                const myAgents: AgentActivity[] = agents
                    .filter((agent: OnchainAgent) => agent.creator === targetAddress || agent.creator.startsWith("GD")) // Simplified for demo
                    .map((agent) => ({
                        id: `agent-${agent.agentId}`,
                        type: 'agent',
                        agentId: agent.agentId,
                        name: agent.name,
                        price: agent.price,
                        asset: agent.asset,
                        timestamp: new Date(agent.createdAt * 1000).toISOString(),
                    }));

                setAgentCount(myAgents.length);
                setHistory(myAgents); 
            } catch (error) {
                console.error('Failed to load dashboard', error);
                setHistory([]);
                setAgentCount(0);
                setIsRegistryLive(false);
            }
        };

        loadDashboard();
    }, [address, lastKnownAddress]);

    if (isInitializing) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h2>Checking Stellar Wallet</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Syncing Freighter session...</p>
                </div>
            </div>
        );
    }

    if (!address && !lastKnownAddress) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h2>Freighter Connection Required</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Please connect your Stellar wallet to view your dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '120px', minHeight: '100vh', paddingBottom: '5rem' }}>
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
                    <p className="section-subtitle">Stellar <span style={{ color: 'var(--accent-primary)' }}>Agentic Workforce</span> Monitor</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/deploy" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Register Agent
                    </Link>
                    <Link to="/marketplace" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={16} />
                        Marketplace
                    </Link>
                </div>
            </div>

            <div className="grid-3" style={{ marginBottom: '4rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        <Activity size={20} /> <span>Stellar Activity</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{history.length}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${isRegistryLive ? '#00e676' : '#ffa500'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        <ShieldCheck size={20} color="#00e676" />
                        <span>Soroban Registry</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isRegistryLive ? '#00e676' : 'orange' }}>
                        {network} Network
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                        Connected to Stellar Horizon Testnet
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid orange' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        <Clock size={20} /> <span>Your Registered Agents</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{agentCount}</div>
                </div>
            </div>

            <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Activity className="pulse-anim" color="var(--accent-primary)" />
                Live Stellar Activity
            </h2>

            {history.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No on-chain activity detected for this wallet yet. Register an agent or hire one to get started.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {history.map((item) => (
                        <div key={item.id} className="glass-panel" style={{
                            padding: '1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 1.5fr',
                            alignItems: 'center', gap: '2rem',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                    {isOnchainTask(item) ? item.agentName : item.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                    {isOnchainTask(item) ? 'TASK_SETTLED' : 'AGENT_REGISTERED'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontFamily: 'monospace' }}>
                                    {isOnchainTask(item) ? `Task #${item.taskId}` : `Agent #${item.agentId}`}
                                </div>
                            </div>

                            <div>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem',
                                    background: isOnchainTask(item) ? 'rgba(0, 230, 118, 0.1)' : 'rgba(0, 176, 255, 0.1)',
                                    color: isOnchainTask(item) ? '#00e676' : '#00b0ff',
                                    border: `1px solid ${isOnchainTask(item) ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 176, 255, 0.2)'}`
                                }}>
                                    <CheckCircle2 size={14} /> {isOnchainTask(item) ? 'Completed' : 'Registered'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    {new Date(item.timestamp).toLocaleString()}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.25rem' }}>
                                <Zap size={20} color="var(--accent-primary)" />
                                <CreditCard size={20} color="var(--accent-primary)" />
                                <Coins size={20} color="var(--accent-primary)" />
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.price} {item.asset}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    {isOnchainTask(item) ? 'Settled via Soroban' : 'Registered on Stellar'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
