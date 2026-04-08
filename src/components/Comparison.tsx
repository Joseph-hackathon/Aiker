import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Zap, CreditCard, Coins } from 'lucide-react';

const Comparison = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <section className="section" id="comparison" style={{ background: 'var(--bg-secondary)', position: 'relative' }}>
            <div className="container">
                <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="section-title">Beyond Toys & Speculation
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                        className="section-subtitle" style={{ margin: '0 auto' }}>
                        While others build speculative meme-tokens or simple API directories, Aiker builds the verifiable execution layer on Stellar.
                    </motion.p>
                </div>

                <motion.div
                    variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                    className="grid-3" style={{ gap: '2rem' }}>

                    {/* Virtuals Protocol */}
                    <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#ff4081' }}>Virtuals.io</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem', minHeight: '60px' }}>
                            Financialization of AI Agents. Users buy tokens of AI personas.
                        </p>
                        <ul style={{ listStyle: 'none', gap: '1rem', display: 'flex', flexDirection: 'column' }}>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}><CheckCircle2 color="rgba(255,255,255,0.2)" size={20} /> <span>Focuses on Entertainment</span></li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}><XCircle color="#ff4081" size={20} /> <span>Requires heavy token speculation</span></li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}><XCircle color="#ff4081" size={20} /> <span>Agents are assets, not workers</span></li>
                        </ul>
                    </motion.div>

                    {/* AGDP io */}
                    <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'orange' }}>AGDP.io (ACP)</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem', minHeight: '60px' }}>
                            An "Amazon of Agentic Society" listing APIs with centralized token rewards.
                        </p>
                        <ul style={{ listStyle: 'none', gap: '1rem', display: 'flex', flexDirection: 'column' }}>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}><CheckCircle2 color="rgba(255,255,255,0.2)" size={20} /> <span>Good for API discovery</span></li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}><AlertCircle color="orange" size={20} /> <span>Relies on Epoch leaderboards</span></li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}><XCircle color="orange" size={20} /> <span>Trust-based endpoints (No execution proof)</span></li>
                        </ul>
                    </motion.div>

                    {/* Aiker */}
                    <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--accent-primary)', boxShadow: '0 0 30px rgba(0, 230, 118, 0.15)' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, var(--accent-secondary), var(--accent-primary))' }}></div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>Aiker (Ours)</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem', minHeight: '60px' }}>
                            Verifiable Labor Protocol integrated via X402, Stripe MPP, and Stellar.
                        </p>
                        <ul style={{ listStyle: 'none', gap: '1rem', display: 'flex', flexDirection: 'column' }}>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <Zap color="var(--accent-primary)" size={20} />
                                <strong>X402 Pay-per-request</strong>
                            </li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <CreditCard color="var(--accent-primary)" size={20} />
                                <strong>Stripe MPP Session Payments</strong>
                            </li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <Coins color="var(--accent-primary)" size={20} />
                                <strong>Immutable Stellar Settlement</strong>
                            </li>
                        </ul>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Comparison;
