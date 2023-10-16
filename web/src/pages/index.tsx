import { useWallet } from '@solana/wallet-adapter-react';
import type { NextPage } from 'next';
import React, { useCallback, useEffect } from 'react';
import { useSDK } from '../contexts/SDK';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useTokenList } from '../contexts/TokenList';

const Home: NextPage = () => {
    const wallet = useWallet();
    const sdk = useSDK();
    const tokenList = useTokenList();

    const fetchAndLogSmartDelegate = useCallback(async () => {
        const smartDelegate = await sdk.readClient.fetchSmartDelegate();
        console.log('Smart Delegate', JSON.stringify(smartDelegate, null, 2));
    }, [sdk]);

    const fetchAndLogTokenAccounts = useCallback(async () => {
        if (!wallet.publicKey) {
            return;
        }

        const [tokenAccounts, token2022Accounts] = await Promise.allSettled(
            [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].map((programId) =>
                sdk.connection.getParsedTokenAccountsByOwner(wallet.publicKey!, {
                    programId,
                })
            )
        );

        if (tokenAccounts.status !== 'fulfilled' || token2022Accounts.status !== 'fulfilled') {
            throw new Error('Error when fetching token accounts');
        }

        const allTokenAcounts = tokenAccounts.value.value.concat(token2022Accounts.value.value);

        console.log(
            'All Token Accounts:',
            allTokenAcounts.map((t) => {
                const mint = t.account.data.parsed.info.mint;
                console.log('account', mint);
                const token = tokenList.allMap[mint];
                if (!token) return mint;
                return token.symbol;
            })
        );
    }, [wallet, sdk]);

    useEffect(() => {
        console.log('Token List:', tokenList);
    }, [tokenList]);

    useEffect(() => {
        console.log(wallet.publicKey?.toBase58());
        fetchAndLogSmartDelegate();
        fetchAndLogTokenAccounts();
    }, [wallet, fetchAndLogSmartDelegate, fetchAndLogTokenAccounts]);

    return <>Home</>;
};

export { getServerSideProps } from '../shared/getServerSideProps';

export default Home;
