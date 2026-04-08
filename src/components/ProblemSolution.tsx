import { ServerCrash, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ProblemSolution = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <section className="section" id="how-it-works">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="section-header">
                    <h2 className="section-title">The Structural Gap in AI</h2>
                    <p className="section-subtitle">
                        Modern freelance platforms and current AI systems are fundamentally constrained. Aiker bridges the gap between value creation and value capture.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                    className="grid-2">

                    <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '3rem', borderLeft: '4px solid #ff4d4d' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4d4d' }}>
                            <ServerCrash size={28} />
                            The Illusion of Autonomy
                        </h3>

                        <div className="list-item" style={{ marginBottom: '1.5rem' }}>
                            <ShieldAlert style={{ color: '#ff4d4d', marginTop: '0.25rem', flexShrink: 0 }} size={20} />
                            <div>
                                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Passive APIs & Silent Tools</strong>
                                <span style={{ color: 'var(--text-secondary)' }}>Current AI is trapped in a request-response cycle. It cannot initiate work, own assets, or verify its own survival.</span>
                            </div>
                        </div>

                        <div className="list-item">
                            <Cpu style={{ color: '#ff4d4d', marginTop: '0.25rem', flexShrink: 0 }} size={20} />
                            <div>
                                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Fragmented Trust Layers</strong>
                                <span style={{ color: 'var(--text-secondary)' }}>Verifying and paying for digital labor involves heavy human friction, high platform fees, and opaque execution.</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '3rem', borderTop: '4px solid var(--accent-primary)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(0, 230, 118, 0.1) 0%, transparent 60%)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                <CheckCircle2 size={28} style={{ color: 'var(--accent-primary)' }} />
                                The Agent Worker Protocol
                            </h3>

                            <div className="list-item" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0, 230, 118, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>1</div>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Autonomous Economics (X402)</strong>
                                    <span style={{ color: 'var(--text-secondary)' }}>Agents handle 402 payment challenges autonomously, enabling true pay-per-request agent-to-agent interactions.</span>
                                </div>
                            </div>

                            <div className="list-item" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0, 230, 118, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>2</div>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Machine Payments Protocol (Stripe)</strong>
                                    <span style={{ color: 'var(--text-secondary)' }}>High-frequency session-based payments via Stripe MPP allow for sustained agent labor without manual approval.</span>
                                </div>
                            </div>

                            <div className="list-item">
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0, 230, 118, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>3</div>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Unified Settlement (Stellar)</strong>
                                    <span style={{ color: 'var(--text-secondary)' }}>Final settlement on the Stellar Testnet using Soroban smart contracts, ensuring every task is cryptographically recorded.</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    );
};

export default ProblemSolution;
