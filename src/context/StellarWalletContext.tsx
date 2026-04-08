import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
    isFreighterConnected,
    getFreighterPublicKey,
    requestFreighterAccess,
    getStellarErrorMessage,
} from '../utils/stellar-wallet';

const WALLET_SESSION_KEY = 'AIKER_STELLAR_CONNECTED';
const LAST_KNOWN_ADDRESS_KEY = 'AIKER_LAST_KNOWN_STELLAR_ADDRESS';

interface StellarWalletContextType {
    isConnected: boolean;
    address: string | null;
    lastKnownAddress: string | null;
    isInitializing: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    network: 'TESTNET' | 'PUBLIC';
}

const StellarWalletContext = createContext<StellarWalletContextType | undefined>(undefined);

export const StellarWalletProvider = ({ children }: { children: ReactNode }) => {
    const [address, setAddress] = useState<string | null>(null);
    const [lastKnownAddress, setLastKnownAddress] = useState<string | null>(() => localStorage.getItem(LAST_KNOWN_ADDRESS_KEY));
    const [isInitializing, setIsInitializing] = useState(true);
    const [network] = useState<'TESTNET' | 'PUBLIC'>('TESTNET');

    const isConnected = Boolean(address);

    useEffect(() => {
        let mounted = true;

        const syncWallet = async () => {
            try {
                if (!(await isFreighterConnected())) {
                    if (mounted) setIsInitializing(false);
                    return;
                }

                if (localStorage.getItem(WALLET_SESSION_KEY) === '1') {
                    const publicKey = await getFreighterPublicKey();
                    if (mounted && publicKey) {
                        setAddress(publicKey);
                        setLastKnownAddress(publicKey);
                        localStorage.setItem(LAST_KNOWN_ADDRESS_KEY, publicKey);
                    }
                }
            } catch (error) {
                console.error('Failed to sync Stellar wallet state', error);
            } finally {
                if (mounted) {
                    setIsInitializing(false);
                }
            }
        };

        syncWallet();

        return () => {
            mounted = false;
        };
    }, []);

    const connect = async () => {
        try {
            if (!(await isFreighterConnected())) {
                alert('Freighter extension not found. Please install or enable it.');
                return;
            }

            const publicKey = await requestFreighterAccess();
            if (publicKey) {
                setAddress(publicKey);
                setLastKnownAddress(publicKey);
                localStorage.setItem(WALLET_SESSION_KEY, '1');
                localStorage.setItem(LAST_KNOWN_ADDRESS_KEY, publicKey);
            } else {
                throw new Error('Failed to retrieve public key from Freighter.');
            }
        } catch (error: unknown) {
            console.error('Failed to connect Stellar wallet', error);
            const message = getStellarErrorMessage(error);
            alert(`Connection failed: ${message}`);
        }
    };

    const disconnect = () => {
        setAddress(null);
        setLastKnownAddress(null);
        localStorage.removeItem(WALLET_SESSION_KEY);
        localStorage.removeItem(LAST_KNOWN_ADDRESS_KEY);
    };

    return (
        <StellarWalletContext.Provider value={{
            isConnected,
            address,
            lastKnownAddress,
            isInitializing,
            connect,
            disconnect,
            network,
        }}>
            {children}
        </StellarWalletContext.Provider>
    );
};

export const useStellarWallet = () => {
    const context = useContext(StellarWalletContext);
    if (context === undefined) {
        throw new Error('useStellarWallet must be used within a StellarWalletProvider');
    }
    return context;
};
