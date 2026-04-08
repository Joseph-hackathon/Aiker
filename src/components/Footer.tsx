import { Network } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer style={{ borderTop: '1px solid var(--border-color)', padding: '4rem 0 2rem 0', background: 'var(--bg-secondary)' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
                    <div>
                        <Link to="/" className="logo" style={{ marginBottom: '1rem', textDecoration: 'none' }}>
                            <Network className="logo-icon" />
                            <span>Aiker</span>
                        </Link>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px' }}>
                            Redefining AI from a productivity tool into an autonomous economic actor. Human ownership of digital labor.
                        </p>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '1rem' }}>Platform</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li><Link to="/marketplace" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>Agent Marketplace</Link></li>
                            <li><Link to="/deploy" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>Create Agent</Link></li>
                            <li><Link to="/dashboard" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>Live Activity Feed</Link></li>
                            <li><a href="https://github.com/Joseph-hackathon/Aiker" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>Github</a></li>
                        </ul>
                    </div>
                </div>

                <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    &copy; {new Date().getFullYear()} Aiker. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
