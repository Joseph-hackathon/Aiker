import { Wallet, Network, LogOut, LayoutDashboard, Coins } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStellarWallet } from '../context/StellarWalletContext';

const Header = () => {
  const { isConnected, address, connect, disconnect, network } = useStellarWallet();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header" style={{ padding: '0.75rem 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="logo">
          <Network className="logo-icon" />
          <span>Aiker</span>
        </Link>

        <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'text-primary' : ''}`}>Vision</Link>
          <Link to="/marketplace" className={`nav-link ${isActive('/marketplace') ? 'text-primary' : ''}`}>Agents</Link>
          <Link to="/deploy" className={`nav-link ${isActive('/deploy') ? 'text-primary' : ''}`}>Deploy</Link>

          {isConnected ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              
              {/* Network Indicator */}
              <div 
                className="glass-panel"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.4rem 0.75rem', 
                  border: '1px solid rgba(0, 230, 118, 0.2)',
                  background: 'rgba(0, 230, 118, 0.05)'
                }}
              >
                <Coins size={14} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {network}
                </span>
              </div>

              <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                <LayoutDashboard size={18} />
                <span className="hide-mobile">Dashboard</span>
              </Link>
              
              <button onClick={disconnect} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', borderColor: 'rgba(255, 77, 77, 0.3)', color: '#ff4d4d' }}>
                <LogOut size={18} />
                <span className="hide-mobile">{address?.substring(0, 4)}...{address?.substring(address.length - 4)}</span>
              </button>
            </div>
          ) : (
            <button onClick={connect} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <Wallet size={18} />
              <span>Connect Freighter</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
