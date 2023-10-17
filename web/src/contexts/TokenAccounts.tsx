import { Account, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, unpackAccount } from '@solana/spl-token';
import { Token, useTokenList } from './TokenList';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSDK } from './SDK';
import { PublicKey } from '@solana/web3.js';

export interface TokenAccount extends Account {
    tokenOrMint: { type: 'token'; token: Token } | { mint: PublicKey; type: 'mint' };
    program: 'spl-token' | 'spl-token-2022';
}

export type TokenAccountsContextValue = { loading: true } | { loading: false; tokenAccounts: TokenAccount[] } | null;

export const TokenAccountsContext = createContext<TokenAccountsContextValue>(null);

function compareTokenAccounts(a: TokenAccount, b: TokenAccount): number {
    if (a.amount > b.amount) return -1;
    else if (a.amount < b.amount) return 1;

    return a.address.toBuffer().compare(b.address.toBuffer());
}

export default function TokenAccountsContextProvider({ children }: PropsWithChildren): JSX.Element {
    const [loadedOnce, setLoadedOnce] = useState(false);
    const [tokenAccounts, setTokenAccounts] = useState<TokenAccountsContextValue>(null);
    const sdk = useSDK();
    const tokenList = useTokenList();
    const { publicKey } = useWallet();

    const fetchAndLoadTokenAccounts = useCallback(async () => {
        if (!publicKey) {
            setTokenAccounts(null);
            return;
        }

        if (!loadedOnce) {
            setTokenAccounts({ loading: true });
        }

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
                tokenOrMint: token ? { type: 'token', token } : { mint: decodedTokenAccount.mint, type: 'mint' },
                program: 'spl-token',
                ...decodedTokenAccount,
            };

            return tokenAccount;
        });

        tokenAccounts.sort(compareTokenAccounts);

        const token2022Accounts = rawToken2022Accounts.value.map((rawTokenAccount) => {
            const decodedTokenAccount = unpackAccount(
                rawTokenAccount.pubkey,
                rawTokenAccount.account,
                TOKEN_2022_PROGRAM_ID
            );

            const token = tokenList.allMap[decodedTokenAccount.mint.toBase58()];

            const tokenAccount: TokenAccount = {
                tokenOrMint: token ? { type: 'token', token } : { mint: decodedTokenAccount.mint, type: 'mint' },
                program: 'spl-token-2022',
                ...decodedTokenAccount,
            };

            return tokenAccount;
        });

        token2022Accounts.sort(compareTokenAccounts);

        const allTokenAccounts = tokenAccounts.concat(token2022Accounts);
        const allTokenAccountsWithMetadata = allTokenAccounts.filter(
            (tokenAccount) => tokenAccount.tokenOrMint.type === 'token'
        );
        const allTokenAccountsWithoutMetadata = allTokenAccounts.filter(
            (tokenAccount) => tokenAccount.tokenOrMint.type === 'mint'
        );

        setTokenAccounts({
            loading: false,
            tokenAccounts: allTokenAccountsWithMetadata.concat(allTokenAccountsWithoutMetadata),
        });
        setLoadedOnce(true);
    }, [publicKey, sdk, tokenList, setTokenAccounts, loadedOnce]);

    useEffect(() => {
        fetchAndLoadTokenAccounts();
    }, [fetchAndLoadTokenAccounts]);

    return <TokenAccountsContext.Provider value={tokenAccounts}>{children}</TokenAccountsContext.Provider>;
}

export function useTokenAccounts(): TokenAccountsContextValue {
    return useContext(TokenAccountsContext);
}
