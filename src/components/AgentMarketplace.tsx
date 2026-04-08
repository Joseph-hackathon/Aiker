import { Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fetchOnchainAgents, type OnchainAgent } from '../services/bounty';

const AgentMarketplace = () => {
    const [agents, setAgents] = useState<OnchainAgent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const loadAgents = async () => {
            try {
                setIsLoading(true);
                setLoadError(null);
                const onchainAgents = await fetchOnchainAgents();
                setAgents(onchainAgents.slice(0, 3));
            } catch (error) {
                console.error('Failed to load homepage marketplace', error);
                setLoadError(error instanceof Error ? error.message : 'Failed to load agents');
            } finally {
                setIsLoading(false);
            }
        };

        loadAgents();
    }, []);

    return (
        <section className="section" id="agents" style={{ position: 'relative', zIndex: 2 }}>
            <div className="container">
                <div className="section-header" style={{ marginBottom: '4rem' }}>
                    <h2 className="section-title">The Agent Marketplace</h2>
                    <p className="section-subtitle">
                        Discover, hire, and deploy autonomous AI workers. These cards now come directly from the Stellar Testnet registry.
                    </p>
                </div>

                {isLoading ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                        Loading on-chain marketplace preview...
                    </div>
                ) : loadError ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderColor: 'rgba(255,77,77,0.3)' }}>
                        <h3 style={{ marginBottom: '0.75rem' }}>Unable to Load Marketplace Preview</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{loadError}</p>
                    </div>
                ) : agents.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '0.75rem' }}>No Agents Registered Yet</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Deploy an agent on Stellar Testnet and it will appear here for everyone.
                        </p>
                    </div>
                ) : (
                    <div className="grid-3" style={{ gap: '2rem' }}>
                        {agents.map((agent, index) => (
                            <motion.div
                                key={agent.agentId}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
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
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                    borderTop: '2px solid var(--accent-primary)'
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
                                        <Bot size={20} />
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

                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', fontWeight: 700 }}>
                                    {agent.name}
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                    {[agent.category, ...agent.traits].filter(Boolean).map((trait) => (
                                        <span key={trait} style={{ fontSize: '0.55rem', color: 'var(--accent-primary)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '0.05rem 0.35rem', borderRadius: '4px', background: 'rgba(0, 230, 118, 0.03)' }}>
                                            {trait}
                                        </span>
                                    ))}
                                </div>
                                <span style={{ fontSize: '0.65rem', background: 'var(--accent-primary)', color: 'black', padding: '0.1rem 0.5rem', borderRadius: '4px', width: 'fit-content', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    ON-CHAIN AGENT
                                </span>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, flexGrow: 1, marginBottom: '2rem' }}>
                                    {agent.description}
                                </p>

                                <Link
                                    to="/marketplace"
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '30px',
                                        color: '#ffffff',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.05em',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'center',
                                        textDecoration: 'none',
                                        display: 'block'
                                    }}
                                >
                                    HIRE WORKER
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AgentMarketplace;
