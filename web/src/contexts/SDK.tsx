import { PropsWithChildren, createContext, useContext, useRef } from 'react';
import {
    PreAuthorizedDebitReadClient,
    PreAuthorizedDebitReadClientImpl,
    TransactionFactory,
    TransactionFactoryImpl,
} from '@seabed-labs/pre-authorized-debit';
import { Connection } from '@solana/web3.js';

export interface SDKContextValue {
    connection: Connection;
    readClient: PreAuthorizedDebitReadClient;
    txFactory: TransactionFactory;
}

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC;
if (!SOLANA_RPC) {
    throw new Error('Env var "NEXT_PUBLIC_SOLANA_RPC" not set');
}

const connection = new Connection(SOLANA_RPC, { commitment: 'confirmed' });
const readClient = PreAuthorizedDebitReadClientImpl.mainnet(connection);
const txFactory = TransactionFactoryImpl.mainnet(connection);

const SDK_CONTEXT_VALUE = {
    connection,
    readClient,
    txFactory,
};

export const SDKContext = createContext<SDKContextValue>(SDK_CONTEXT_VALUE);

export default function SDKContextProvider({ children }: PropsWithChildren): JSX.Element {
    const value = useRef(SDK_CONTEXT_VALUE);

    return <SDKContext.Provider value={value.current}>{children}</SDKContext.Provider>;
}

export function useSDK(): SDKContextValue {
    return useContext(SDKContext);
}
