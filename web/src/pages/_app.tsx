import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import type { AppProps } from 'next/app';
import type { FC } from 'react';
import React, { useMemo } from 'react';
import Layout from '../components/Layout';
import HeartbeatContextProvider from '../contexts/Heartbeat';
import { Chakra } from '../components/Chakra';
import SDKContextProvider from '../contexts/SDK';
import TokenListContextProvider from '../contexts/TokenList';
import { getServerSideProps } from './_app';
import TokenAccountsContextProvider from '../contexts/TokenAccounts';

// Use require instead of import since order matters
require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');

const App: FC<AppProps<Awaited<ReturnType<typeof getServerSideProps>>['props']>> = ({ Component, pageProps }) => {
    // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            /**
             * Wallets that implement either of these standards will be available automatically.
             *
             *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
             *     (https://github.com/solana-mobile/mobile-wallet-adapter)
             *   - Solana Wallet Standard
             *     (https://github.com/solana-labs/wallet-standard)
             *
             * If you wish to support a wallet that supports neither of those standards,
             * instantiate its legacy wallet adapter here. Common legacy adapters can be found
             * in the npm package `@solana/wallet-adapter-wallets`.
             */
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );

    return (
        <TokenListContextProvider {...pageProps}>
            <SDKContextProvider>
                <HeartbeatContextProvider>
                    <Chakra cookies={pageProps.cookies}>
                        <ConnectionProvider endpoint={endpoint}>
                            <WalletProvider wallets={wallets} autoConnect>
                                <TokenAccountsContextProvider>
                                    <WalletModalProvider>
                                        <Layout>
                                            <Component {...pageProps} />
                                        </Layout>
                                    </WalletModalProvider>
                                </TokenAccountsContextProvider>
                            </WalletProvider>
                        </ConnectionProvider>
                    </Chakra>
                </HeartbeatContextProvider>
            </SDKContextProvider>
        </TokenListContextProvider>
    );
};

export { getServerSideProps } from '../shared/getServerSideProps';

export default App;
