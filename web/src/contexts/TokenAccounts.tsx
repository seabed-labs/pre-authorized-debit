import { Account, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, unpackAccount } from '@solana/spl-token';
import { Token, useTokenList } from './TokenList';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSDK } from './SDK';
import { PublicKey } from '@solana/web3.js';

export interface TokenAccount extends Account {
    token: Token | { mint: PublicKey };
    program: 'spl-token' | 'spl-token-2022';
}

export type TokenAccountsContextValue = { loading: true } | { loading: false; tokenAccounts: TokenAccount[] } | null;

export const TokenAccountsContext = createContext<TokenAccountsContextValue>(null);

export default function TokenAccountsContextProvider({ children }: PropsWithChildren): JSX.Element {
    const [tokenAccounts, setTokenAccounts] = useState<TokenAccountsContextValue>(null);
    const sdk = useSDK();
    const tokenList = useTokenList();
    const { publicKey } = useWallet();

    const fetchAndLoadTokenAccounts = useCallback(async () => {
        if (!publicKey) {
            setTokenAccounts(null);
            return;
        }

        setTokenAccounts({ loading: true });

        const [rawTokenAccounts, rawToken2022Accounts] = await Promise.all([
            sdk.connection.getTokenAccountsByOwner(publicKey, {
                programId: TOKEN_PROGRAM_ID,
            }),
            sdk.connection.getTokenAccountsByOwner(publicKey, {
                programId: TOKEN_2022_PROGRAM_ID,
            }),
        ]);

        const tokenAccounts = rawTokenAccounts.value.map((rawTokenAccount) => {
            const decodedTokenAccount = unpackAccount(
                rawTokenAccount.pubkey,
                rawTokenAccount.account,
                TOKEN_PROGRAM_ID
            );

            const token = tokenList.allMap[decodedTokenAccount.mint.toBase58()];

            const tokenAccount: TokenAccount = {
                token: token ?? { mint: decodedTokenAccount.mint },
                program: 'spl-token',
                ...decodedTokenAccount,
            };

            return tokenAccount;
        });

        const token2022Accounts = rawToken2022Accounts.value.map((rawTokenAccount) => {
            const decodedTokenAccount = unpackAccount(
                rawTokenAccount.pubkey,
                rawTokenAccount.account,
                TOKEN_2022_PROGRAM_ID
            );

            const token = tokenList.allMap[decodedTokenAccount.mint.toBase58()];

            const tokenAccount: TokenAccount = {
                token: token ?? { mint: decodedTokenAccount.mint },
                program: 'spl-token-2022',
                ...decodedTokenAccount,
            };

            return tokenAccount;
        });

        setTokenAccounts({ loading: false, tokenAccounts: tokenAccounts.concat(token2022Accounts) });
    }, [publicKey, sdk, tokenList, setTokenAccounts]);

    useEffect(() => {
        fetchAndLoadTokenAccounts();
    }, [fetchAndLoadTokenAccounts]);

    return <TokenAccountsContext.Provider value={tokenAccounts}>{children}</TokenAccountsContext.Provider>;
}

export function useTokenAccounts(): TokenAccountsContextValue {
    return useContext(TokenAccountsContext);
}
