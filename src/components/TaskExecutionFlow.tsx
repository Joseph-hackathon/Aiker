import { useMemo, useState, type KeyboardEvent } from 'react';
import {
    executeAgentWithX402,
    settleOnStellar,
    type AgentConversationMessage,
    type AgentTaskBrief,
} from '../services/bounty';
import {
    CheckCircle2,
    Send,
    Zap,
    CreditCard,
    Coins
} from 'lucide-react';
import { useStellarWallet } from '../context/StellarWalletContext';

interface Props {
    agentId: number;
    agentName: string;
    agentDescription: string;
    apiEndpoint: string;
    price: string;
    asset: string;
    onClose: () => void;
    embedded?: boolean;
}

type TaskPhase = 'brief' | 'workspace' | 'settling' | 'done';

const getLatestAssistantReply = (messages: AgentConversationMessage[]) => {
    return [...messages].reverse().find((message) => message.role === 'assistant')?.content || '';
};

const TaskExecutionFlow = ({
    agentId,
    agentName,
    agentDescription,
    apiEndpoint,
    price,
    asset,
    onClose,
    embedded = false,
}: Props) => {
    const { isConnected } = useStellarWallet();

    const [phase, setPhase] = useState<TaskPhase>('brief');
    const [step, setStep] = useState(0);
    const [taskObjective, setTaskObjective] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [conversation, setConversation] = useState<AgentConversationMessage[]>([]);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [stellarTxHash, setStellarTxHash] = useState('');
    const [taskId, setTaskId] = useState<number | null>(null);
    const [deliveryPreview, setDeliveryPreview] = useState('');
    const [error, setError] = useState<string | null>(null);

    const taskBrief: AgentTaskBrief = useMemo(
        () => ({
            objective: taskObjective.trim(),
            context: "",
            requestedOutput: "Result",
            urls: [],
            attachments: [],
        }),
        [taskObjective]
    );

    const latestAssistantReply = useMemo(
        () => getLatestAssistantReply(conversation),
        [conversation]
    );

    const startWorkspace = () => {
        if (!isConnected) {
            setError('Please connect your Stellar wallet first.');
            return;
        }
        if (!taskObjective.trim()) {
            setError('Add a clear task objective before hiring this agent.');
            return;
        }
        setError(null);
        setConversation([
            {
                role: 'assistant',
                content: `Task room ready for ${agentName} on Stellar. Ask for analysis, revisions, or a final report.`,
            },
        ]);
        setPhase('workspace');
    };

    const sendMessage = async () => {
        const prompt = chatInput.trim();
        if (!prompt || isSendingMessage) return;

        const nextConversation: AgentConversationMessage[] = [
            ...conversation,
            { role: 'user', content: prompt },
        ];

        setError(null);
        setChatInput('');
        setConversation(nextConversation);
        setIsSendingMessage(true);

        try {
            const result = await executeAgentWithX402({
                agentId,
                agentName,
                agentDescription,
                apiEndpoint,
                price,
                asset,
                taskBrief,
                conversation: nextConversation,
            });

            setConversation((current) => [
                ...current,
                { role: 'assistant', content: result.output },
            ]);
            setDeliveryPreview(result.output);
        } catch (messageError) {
            console.error('Agent message failed:', messageError);
            setError(messageError instanceof Error ? messageError.message : 'Agent response failed.');
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleChatKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            await sendMessage();
        }
    };

    const finalizeDelivery = async () => {
        const acceptedDelivery = latestAssistantReply || deliveryPreview;
        if (!acceptedDelivery.trim()) {
            setError('Ask the agent for a deliverable before finalizing the task.');
            return;
        }

        setError(null);
        setPhase('settling');

        try {
            setStep(1);
            const settlement = await settleOnStellar(agentId, agentName);
            setStellarTxHash(settlement.txHash);
            setTaskId(settlement.taskId);
            setDeliveryPreview(acceptedDelivery);

            setStep(3);
            setPhase('done');
        } catch (pipelineError) {
            console.error('Settlement failed:', pipelineError);
            setError(pipelineError instanceof Error ? pipelineError.message : 'Settlement failed');
            setPhase('workspace');
        }
    };

    return (
        <div
            style={{
                position: embedded ? 'relative' : 'fixed',
                top: embedded ? undefined : 0,
                left: embedded ? undefined : 0,
                right: embedded ? undefined : 0,
                bottom: embedded ? undefined : 0,
                background: embedded ? 'transparent' : 'rgba(0,0,0,0.9)',
                backdropFilter: embedded ? 'none' : 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: embedded ? 'auto' : 9999,
                padding: embedded ? 0 : '1rem',
            }}
        >
            <div
                className="glass-panel"
                style={{
                    width: '100%',
                    maxWidth: embedded ? '100%' : '820px',
                    padding: '2.25rem',
                    border: '1px solid rgba(0, 230, 118, 0.2)',
                    boxShadow: '0 0 50px rgba(0, 230, 118, 0.05)',
                    position: 'relative',
                    maxHeight: embedded ? 'none' : '92vh',
                    overflowY: embedded ? 'visible' : 'auto',
                }}
            >
                {phase === 'brief' && (
                    <>
                        <h2 style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Hire {agentName}</span>
                            <span className="badge" style={{ marginBottom: 0 }}>{price} {asset}</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Utilizing Stellar Testnet and X402 protocol for secure agentic labor.
                        </p>

                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Task Objective</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Describe the task for the Stellar Agent..."
                                    value={taskObjective}
                                    onChange={(event) => setTaskObjective(event.target.value)}
                                    className="glass-panel"
                                    style={{ padding: '0.85rem', width: '100%', background: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                            </div>

                            {error && (
                                <div style={{ color: '#ff4d4d', fontSize: '0.9rem', background: 'rgba(255,77,77,0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,77,77,0.2)' }}>
                                    {error}
                                </div>
                            )}
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                <button onClick={onClose} className="btn" style={{ width: '100%' }}>CLOSE</button>
                                <button onClick={startWorkspace} className="btn btn-primary" style={{ width: '100%' }}>
                                    OPEN STELLAR WORKSPACE
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {phase === 'workspace' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Agent Workspace: {agentName}</h3>
                            <span className="badge">{price} {asset}</span>
                        </div>
                        
                        <div className="glass-panel" style={{ flex: 1, padding: '1rem', overflowY: 'auto', minHeight: '340px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {conversation.map((msg, i) => (
                                <div key={i} style={{ marginBottom: '0.5rem', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                    <div style={{ display: 'inline-block', padding: '0.75rem', borderRadius: '12px', background: msg.role === 'user' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,255,255,0.08)', border: msg.role === 'user' ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.1)', maxWidth: '85%', textAlign: 'left' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{msg.role === 'user' ? 'You' : agentName}</div>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isSendingMessage && (
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ display: 'inline-block', padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                        {agentName} is thinking...
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <textarea 
                                value={chatInput} 
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={handleChatKeyDown}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', resize: 'none' }}
                                placeholder="Type your message..."
                                rows={2}
                            />
                            <button onClick={sendMessage} className="btn btn-primary" disabled={isSendingMessage || !chatInput.trim()} style={{ width: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-primary)' }}>
                                <Send size={24} color="#000000" strokeWidth={2.5} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={onClose} className="btn" style={{ flex: 1 }}>EXIT</button>
                            <button onClick={finalizeDelivery} className="btn btn-primary" style={{ flex: 1 }} disabled={!latestAssistantReply || isSendingMessage}>
                                FINALIZE & SETTLE
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'settling' && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '2rem' }}>Settling on Stellar Testnet</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start', maxWidth: '300px', margin: '0 auto' }}>
                             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', opacity: step >= 1 ? 1 : 0.3 }}>
                                <Zap size={24} color={step > 1 ? "#00e676" : "orange"} />
                                <span>X402 Challenge Authentication</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', opacity: step >= 2 ? 1 : 0.3 }}>
                                <CreditCard size={24} color={step > 2 ? "#00e676" : "orange"} />
                                <span>Stripe MPP Session Authorization</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', opacity: step >= 3 ? 1 : 0.3 }}>
                                <Coins size={24} color={step >= 3 ? "#00e676" : "orange"} />
                                <span>Stellar Network Finality</span>
                            </div>
                        </div>
                    </div>
                )}

                {phase === 'done' && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <CheckCircle2 size={64} color="#00e676" style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ marginBottom: '1rem' }}>Task Settled!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>The agent labor has been verified and settled on the Stellar network.</p>
                        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Transaction Hash:</span>
                                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '0.25rem' }}>{stellarTxHash}</div>
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Task ID:</span>
                                <div style={{ fontWeight: 'bold', marginTop: '0.25rem' }}>#{taskId}</div>
                            </div>
                        </div>
                        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>CLOSE WORKSPACE</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskExecutionFlow;
