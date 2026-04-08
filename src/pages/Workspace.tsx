import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import TaskExecutionFlow from '../components/TaskExecutionFlow';
import { useStellarWallet } from '../context/StellarWalletContext';
import { Bot, MessageSquarePlus } from 'lucide-react';

type WorkspaceSession = {
    sessionId: string;
    agentId: number;
    name: string;
    description: string;
    apiEndpoint: string;
    price: string;
    asset: string;
    title: string;
    preview: string;
    lastUpdated: string;
};

const WORKSPACE_LIST_KEY = 'AIKER_WORKSPACE_SESSIONS';
const ACTIVE_WORKSPACE_KEY = 'AIKER_ACTIVE_WORKSPACE';

const loadWorkspaceSessions = (): WorkspaceSession[] => {
    const raw = sessionStorage.getItem(WORKSPACE_LIST_KEY);
    if (!raw) return [];

    try {
        return JSON.parse(raw) as WorkspaceSession[];
    } catch {
        sessionStorage.removeItem(WORKSPACE_LIST_KEY);
        return [];
    }
};

const saveWorkspaceSessions = (sessions: WorkspaceSession[]) => {
    sessionStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(sessions));
};

const upsertWorkspaceSession = (session: WorkspaceSession) => {
    const existing = loadWorkspaceSessions().filter((item) => item.sessionId !== session.sessionId);
    const next = [session, ...existing].sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
    saveWorkspaceSessions(next);
    return next;
};

const Workspace = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isInitializing, address, lastKnownAddress } = useStellarWallet();
    const [workspace, setWorkspace] = useState<WorkspaceSession | null>(null);
    const [sessions, setSessions] = useState<WorkspaceSession[]>([]);

    useEffect(() => {
        const fromNavigation = (location.state as { workspace?: WorkspaceSession } | null)?.workspace;
        if (fromNavigation) {
            const session = {
                ...fromNavigation,
                sessionId: fromNavigation.sessionId || `${fromNavigation.agentId}-${Date.now()}`,
                title: fromNavigation.title || `${fromNavigation.name} workspace`,
                preview: fromNavigation.preview || fromNavigation.description || 'New hired agent',
                lastUpdated: fromNavigation.lastUpdated || new Date().toISOString(),
            };
            sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, JSON.stringify(session));
            setWorkspace(session);
            setSessions(upsertWorkspaceSession(session));
            return;
        }

        const allSessions = loadWorkspaceSessions();
        setSessions(allSessions);

        const persisted = sessionStorage.getItem(ACTIVE_WORKSPACE_KEY);
        if (persisted) {
            try {
                setWorkspace(JSON.parse(persisted) as WorkspaceSession);
                return;
            } catch {
                sessionStorage.removeItem(ACTIVE_WORKSPACE_KEY);
            }
        }

        if (allSessions.length > 0) {
            setWorkspace(allSessions[0]);
            sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, JSON.stringify(allSessions[0]));
        }
    }, [location.state]);

    if (isInitializing) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h2>Opening Stellar Workspace</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Syncing Freighter session...</p>
                </div>
            </div>
        );
    }

    if (!address && !lastKnownAddress) {
        return (
            <div className="container" style={{ paddingTop: '120px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ maxWidth: '560px', width: '100%', padding: '3rem', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Freighter Connection Required</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Connect your Stellar wallet to continue working with hired agents.
                    </p>
                    <Link to="/marketplace" className="btn btn-secondary">Back to Marketplace</Link>
                </div>
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="container" style={{ paddingTop: '120px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ maxWidth: '620px', width: '100%', padding: '3rem', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1rem' }}>No Active Agent Workspace</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Hire an agent from the marketplace to open a dedicated Stellar chat workspace.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/marketplace" className="btn btn-primary">Browse Agents</Link>
                        <Link to="/dashboard" className="btn btn-secondary">Go to Dashboard</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '120px', minHeight: '100vh', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
                <div>
                    <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Agent Workspace</h1>
                    <p className="section-subtitle">
                        Collaborate and settle on Stellar with <span style={{ color: 'var(--accent-primary)' }}>{workspace.name}</span>.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/marketplace" className="btn btn-secondary">Marketplace</Link>
                    <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
                <aside className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: '110px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Stellar Sessions</div>
                            <h2 style={{ fontSize: '1.2rem' }}>History</h2>
                        </div>
                        <Link to="/marketplace" className="btn btn-secondary" style={{ padding: '0.55rem 0.8rem' }}>
                            <MessageSquarePlus size={16} />
                        </Link>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {sessions.map((session) => (
                            <button
                                key={session.sessionId}
                                type="button"
                                onClick={() => {
                                    setWorkspace(session);
                                    sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, JSON.stringify(session));
                                }}
                                className="glass-panel"
                                style={{
                                    textAlign: 'left',
                                    padding: '0.9rem',
                                    border: session.sessionId === workspace.sessionId
                                        ? '1px solid rgba(0, 230, 118, 0.35)'
                                        : '1px solid rgba(255,255,255,0.08)',
                                    background: session.sessionId === workspace.sessionId
                                        ? 'rgba(0, 230, 118, 0.08)'
                                        : 'rgba(255,255,255,0.02)',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                    <Bot size={16} color="#00e676" />
                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{session.name}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', marginBottom: '0.35rem', color: '#ffffff' }}>{session.title}</div>
                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                                    {session.preview}
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                <TaskExecutionFlow
                    key={workspace.sessionId}
                    agentId={workspace.agentId}
                    agentName={workspace.name}
                    agentDescription={workspace.description}
                    apiEndpoint={workspace.apiEndpoint}
                    price={workspace.price}
                    asset={workspace.asset}
                    embedded
                    onClose={() => {
                        const remaining = sessions.filter((session) => session.sessionId !== workspace.sessionId);
                        setSessions(remaining);
                        saveWorkspaceSessions(remaining);
                        sessionStorage.removeItem(`AIKER_WORKSPACE_STATE:${workspace.sessionId}`);
                        if (remaining[0]) {
                            setWorkspace(remaining[0]);
                            sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, JSON.stringify(remaining[0]));
                            return;
                        }

                        sessionStorage.removeItem(ACTIVE_WORKSPACE_KEY);
                        setWorkspace(null);
                        navigate('/marketplace');
                    }}
                />
            </div>
        </div>
    );
};

export default Workspace;
