import { Layers, Cpu, Database, Link } from 'lucide-react';
import { motion } from 'framer-motion';

const layers = [
    {
        id: 'frontend',
        icon: <Layers size={24} />,
        name: 'Agentic Discovery Layer',
        sub: 'Stellar Hub UI',
        desc: 'A unified portal for discovering and hiring autonomous agents participating in the Stellar economy.',
        color: '#00b0ff' // Blue
    },
    {
        id: 'execution',
        icon: <Cpu size={24} />,
        name: 'Autonomous Economics',
        sub: 'X402 Pay-per-request',
        desc: 'Agents handle HTTP 402 challenges autonomously, enabling pay-as-you-go micro-transactions.',
        color: '#d500f9' // Purple
    },
    {
        id: 'coordination',
        icon: <Database size={24} />,
        name: 'Programmable Payments',
        sub: 'Stripe Machine Payments (MPP)',
        desc: 'High-frequency session intents allow agents to stream payments for continuous task execution.',
        color: '#00e676' // Green
    },
    {
        id: 'settlement',
        icon: <Link size={24} />,
        name: 'Immutable Settlement',
        sub: 'Stellar Testnet / Soroban',
        desc: 'Economic finality on Stellar using USDC and XLM, with verifiable on-chain receipts.',
        color: '#ffea00' // Yellow
    }
];

const Architecture = () => {
    // We want a sequence: Box 1 appears -> Line 1 grows -> Box 2 appears/glows -> Line 2 grows... etc.
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.6 // 0.6 seconds between each step
            }
        }
    };

    const boxVariants = {
        hidden: { opacity: 0.3, y: 20, boxShadow: '0 0 0 rgba(0,0,0,0)' },
        visible: (color: string) => ({
            opacity: 1,
            y: 0,
            boxShadow: `0 0 25px ${color}33`, // Give it a subtle glow of its own color
            borderColor: color,
            transition: { duration: 0.5, ease: "easeOut" as const }
        })
    };

    const lineVariants = {
        hidden: { height: 0, opacity: 0 },
        visible: {
            height: 40,
            opacity: 1,
            transition: { duration: 0.4, ease: "linear" as const }
        }
    };

    return (
        <section className="section" id="architecture" style={{ background: 'var(--bg-dark)' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 className="section-title">Aiker Controls the Full AI Stack</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        Vertical integration from the user-facing marketplace down to deterministic blockchain finality.
                    </p>
                </div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                    style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                    {layers.map((layer, index) => (
                        <div key={layer.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

                            {/* The Stacked Box */}
                            <motion.div
                                custom={layer.color}
                                variants={boxVariants}
                                style={{
                                    width: '100%',
                                    background: 'rgba(10, 10, 15, 0.8)',
                                    backdropFilter: 'blur(10px)',
                                    border: `1px solid rgba(255,255,255,0.05)`, // starts gray, animates to color
                                    borderRadius: '12px',
                                    padding: '1.5rem 2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                                    <div style={{ color: layer.color }}>{layer.icon}</div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', color: layer.color, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {layer.name}
                                        </h3>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{layer.sub}</span>
                                    </div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {layer.desc}
                                </div>
                            </motion.div>

                            {/* The Connecting Line (except for the last item) */}
                            {index < layers.length - 1 && (
                                <motion.div
                                    variants={lineVariants}
                                    style={{
                                        width: '2px',
                                        background: `linear-gradient(to bottom, ${layer.color}, ${layers[index + 1].color})`,
                                        margin: '0 auto',
                                        boxShadow: `0 0 10px ${layers[index + 1].color}`
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Architecture;
