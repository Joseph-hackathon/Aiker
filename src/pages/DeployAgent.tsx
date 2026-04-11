import { useEffect, useState } from 'react';
import { useStellarWallet } from '../context/StellarWalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Zap, CreditCard, Coins } from 'lucide-react';
import { registerAgentOnStellar } from '../services/bounty';

const DeployAgent = () => {
    const { isConnected, connect, address } = useStellarWallet();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [registeredAgentId, setRegisteredAgentId] = useState<number | null>(null);
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: 'Sentinel Stellar Bot',
        category: 'Research',
        description: 'Advanced Stellar network analyzer providing deep insights into on-chain liquidity and yield.',
        apiEndpoint: 'https://aiker-agent-lumen-scout.vercel.app/api/execute',
        price: '2.5',
        asset: 'XLM',
        payoutAddress: '',
        network: 'Stellar Testnet',
        traits: ['Analytical', 'High-Speed']
    });

    const availableTraits = [
        'Analytical', 'Creative', 'High-Speed', 'Memory-Enabled',
        'Self-Refining', 'Multi-Lingual', 'Deterministic', 'Low-Latency'
    ];

    useEffect(() => {
        if (address && !formData.payoutAddress) {
            setFormData(prev => ({ ...prev, payoutAddress: address }));
        }
    }, [address, formData.payoutAddress]);

    const toggleTrait = (trait: string) => {
        setFormData(prev => ({
            ...prev,
            traits: prev.traits.includes(trait)
                ? prev.traits.filter(t => t !== trait)
                : [...prev.traits, trait]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isConnected) {
            await connect();
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await registerAgentOnStellar(formData);
            setRegisteredAgentId(result.agentId);
            setTxHash(result.txHash);
            setShowSuccessModal(true);
        } catch (submitError) {
            console.error('Agent registration failed', submitError);
            setError(submitError instanceof Error ? submitError.message : 'Agent registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '120px', minHeight: '100vh', maxWidth: '800px', paddingBottom: '4rem' }}>
            <div className="section-header" style={{ marginBottom: '3rem', textAlign: 'left' }}>
                <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Deploy Agent Worker</h1>
                <p className="section-subtitle">Register your autonomous worker on Stellar Testnet for global verifiable labor.</p>
            </div>

            <div className="glass-panel" style={{ padding: '2.5rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Agent Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Sentinel Stellar Bot"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit' }}
                            >
                                <option>Research</option>
                                <option>Content Creation</option>
                                <option>Data Analysis</option>
                                <option>Automation</option>
                                <option>Development</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Detailed Description</label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Describe what tasks this agent excels at..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Machine Capabilities</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                            {availableTraits.map(trait => (
                                <button
                                    key={trait}
                                    type="button"
                                    onClick={() => toggleTrait(trait)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        background: formData.traits.includes(trait) ? 'var(--accent-primary)' : 'rgba(255,255,255,0.02)',
                                        border: '1px solid',
                                        borderColor: formData.traits.includes(trait) ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                                        color: formData.traits.includes(trait) ? '#00' : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: 600
                                    }}
                                >
                                    {trait}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Worker API Endpoint (X402 Ready)</label>
                        <input
                            type="url"
                            required
                            placeholder="https://your-app.vercel.app/api/aiker/execute"
                            value={formData.apiEndpoint}
                            onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                            style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit' }}
                        />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', padding: '1rem', background: 'rgba(0, 230, 118, 0.05)', borderRadius: '12px', border: '1px solid rgba(0, 230, 118, 0.1)' }}>
                            <Zap size={24} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                <strong>X402 Protocol:</strong> Your agent endpoint must be capable of issuing 402 challenges. Aiker will autonomously negotiate these payments via Stellar.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Worker Payout Address (G...)</label>
                            <input
                                type="text"
                                required
                                placeholder={address || "G..."}
                                value={formData.payoutAddress}
                                onChange={(e) => setFormData({ ...formData, payoutAddress: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', fontSize: '0.85rem' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Settlement Asset</label>
                            <select
                                value={formData.asset}
                                onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit' }}
                            >
                                <option>XLM</option>
                                <option>USDC</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Price per Task</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="2.5"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit' }}
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,77,77,0.3)', background: 'rgba(255,77,77,0.08)', color: '#ff7070' }}>
                            {error}
                        </div>
                    )}

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

                    <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1rem' }} disabled={isSubmitting}>
                        {isSubmitting ? 'Registering On Stellar...' : (!isConnected ? 'Connect Freighter to Deploy' : 'Deploy to Stellar Testnet')}
                    </button>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <CreditCard size={14} /> Stripe MPP Enabled
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <Coins size={14} /> Soroban Verified
                        </div>
                    </div>
                </form>
            </div>

            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '3rem', textAlign: 'center', border: '1px solid var(--accent-primary)' }}
                        >
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0, 230, 118, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', color: 'var(--accent-primary)' }}>
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Agent Registered On-Chain!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Your agent is now part of the Stellar global marketplace registry and ready for work.
                            </p>
                            {registeredAgentId !== null && (
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                    Agent #{registeredAgentId}
                                </p>
                            )}
                            {txHash && (
                                <a
                                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.9rem', width: '100%', marginBottom: '1rem' }}
                                >
                                    View on Stellar Expert
                                </a>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Link to="/marketplace" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>View Marketplace</Link>
                                <Link to="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>Check Dashboard</Link>
                            </div>

                            <button onClick={() => setShowSuccessModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '1.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeployAgent;
