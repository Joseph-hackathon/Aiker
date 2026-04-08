import { Bot } from 'lucide-react';
import { useStellarWallet } from '../context/StellarWalletContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOnchainAgents, type OnchainAgent } from '../services/bounty';

const Marketplace = () => {
    const { isConnected, connect } = useStellarWallet();
    const navigate = useNavigate();
    const [agents, setAgents] = useState<OnchainAgent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const loadAgents = async () => {
            try {
                setIsLoading(true);
                setLoadError(null);
                const onchainAgents = await fetchOnchainAgents();
                setAgents(onchainAgents);
            } catch (error) {
                console.error('Failed to load Stellar on-chain agents', error);
                setLoadError(error instanceof Error ? error.message : 'Failed to load agents');
            } finally {
                setIsLoading(false);
            }
        };

        loadAgents();
    }, []);

    const handleHire = async (agent: OnchainAgent) => {
        if (!isConnected) {
            await connect();
            return;
        }

        const workspace = {
            sessionId: `${agent.agentId}-${Date.now()}`,
            agentId: agent.agentId,
            name: agent.name,
            description: agent.description,
            apiEndpoint: agent.apiEndpoint,
            price: agent.price,
            asset: agent.asset,
            title: `${agent.name} workspace`,
            preview: agent.description || 'New hired agent',
            lastUpdated: new Date().toISOString(),
        };

        sessionStorage.setItem('AIKER_ACTIVE_WORKSPACE', JSON.stringify(workspace));
        navigate('/workspace', { state: { workspace } });
    };

    return (
        <section className="section" style={{ paddingTop: '120px', minHeight: '100vh' }}>
            <div className="container">
                <div className="section-header" style={{ marginBottom: '3rem', textAlign: 'left', maxWidth: 'none' }}>
                    <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Agent Marketplace</h1>
                    <p className="section-subtitle">Browse and hire on-chain AI labor registered on Stellar Testnet.</p>
                </div>

                {isLoading ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                        Loading Soroban agent registry...
                    </div>
                ) : loadError ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderColor: 'rgba(255,77,77,0.3)' }}>
                        <h3 style={{ marginBottom: '0.75rem' }}>Unable to Load Agents</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{loadError}</p>
                    </div>
                ) : agents.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '0.75rem' }}>No Agents Registered Yet</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Register an agent on Stellar Testnet to see it appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid-3" style={{ gap: '2rem' }}>
                        {agents.map((agent) => (
                            <div
                                key={agent.agentId}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: '#050505',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    padding: '1.5rem',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'rgba(0, 230, 118, 0.08)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#00e676'
                                    }}>
                                        <Bot size={24} />
                                    </div>
                                    <div style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.05em'
                                    }}>
                                        {agent.price} {agent.asset}
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', fontWeight: 700 }}>{agent.name}</h3>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                    {[agent.category, ...agent.traits].filter(Boolean).map((trait) => (
                                        <span key={trait} style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(0, 230, 118, 0.03)' }}>
                                            {trait}
                                        </span>
                                    ))}
                                </div>

                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
                                    Agent #{agent.agentId} • {agent.completedTasks} task{agent.completedTasks === 1 ? '' : 's'}
                                </p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, flexGrow: 1, marginBottom: '2rem' }}>{agent.description}</p>

                                <button
                                    onClick={() => handleHire(agent)}
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem',
                                        background: isConnected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '30px',
                                        color: isConnected ? '#000000' : '#ffffff',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.05em',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {!isConnected ? 'CONNECT FREIGHTER TO HIRE' : 'HIRE AGENT'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Marketplace;
