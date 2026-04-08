import {
    isConnected,
    getAddress,
    requestAccess,
    signTransaction,
    signAuthEntry,
} from '@stellar/freighter-api';

export const isFreighterConnected = async (): Promise<boolean> => {
    try {
        const result = await isConnected();
        return !!(result && (result as any).isConnected);
    } catch {
        return false;
    }
};

export const getFreighterPublicKey = async (): Promise<string | null> => {
    try {
        const result = await getAddress();
        if (typeof result === 'string') {
            return result;
        }
        if (result && typeof result === 'object' && 'address' in result) {
            return (result as { address: string }).address;
        }
        return null;
    } catch (e) {
        console.error("Freighter getAddress error", e);
        return null;
    }
};

export const signStellarTransaction = async (xdr: string, network: 'TESTNET' | 'PUBLIC'): Promise<string | null> => {
    try {
        const passphrase = network === 'TESTNET' 
            ? 'Test SDF Network ; September 2015' 
            : 'Public Global Stellar Network ; October 2015';
            
        const result = await signTransaction(xdr, { networkPassphrase: passphrase });
        if (typeof result === 'string') return result;
        return (result as any).signedTxXdr || null;
    } catch (e) {
        console.error("Freighter sign error", e);
        return null;
    }
};

export const signSorobanAuthEntry = async (entryXdr: string, network: 'TESTNET' | 'PUBLIC'): Promise<string | null> => {
    try {
        const passphrase = network === 'TESTNET' 
            ? 'Test SDF Network ; September 2015' 
            : 'Public Global Stellar Network ; October 2015';
            
        const result = await signAuthEntry(entryXdr, { networkPassphrase: passphrase });
        if (typeof result === 'string') return result;
        return (result as any).signedTxXdr || null;
    } catch (e) {
        console.error("Freighter auth sign error", e);
        return null;
    }
};

export const getStellarErrorMessage = (error: unknown): string => {
    const err = error as { message?: string };
    return err.message || 'Unknown Stellar error';
};

export const requestFreighterAccess = async (): Promise<string | null> => {
    try {
        const result = await requestAccess();
        if (typeof result === 'string') {
            return result;
        }
        if (result && typeof result === 'object' && 'address' in result) {
            return (result as { address: string }).address;
        }
        return null;
    } catch (e) {
        console.error("Freighter requestAccess error", e);
        return null;
    }
};
