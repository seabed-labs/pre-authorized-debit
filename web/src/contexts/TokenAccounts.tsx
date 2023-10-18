import { Account, Mint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, unpackAccount, unpackMint } from '@solana/spl-token';
import { Token, useTokenList } from './TokenList';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSDK } from './SDK';
import { AccountInfo, PublicKey } from '@solana/web3.js';

export interface TokenAccount extends Account {
    tokenOrMint: { type: 'token'; token: Token } | { mint: Mint; type: 'mint' };
    program: 'spl-token' | 'spl-token-2022';
}

export type TokenAccountsContextValue =
    | { loading: true }
    | { loading: false; tokenAccounts: TokenAccount[]; triggerRefresh(): void }
    | null;

export const TokenAccountsContext = createContext<TokenAccountsContextValue>(null);

function compareTokenAccounts(a: TokenAccount, b: TokenAccount): number {
    if (a.amount > b.amount) return -1;
    else if (a.amount < b.amount) return 1;

    return a.address.toBuffer().compare(b.address.toBuffer());
}

export default function TokenAccountsContextProvider({ children }: PropsWithChildren): JSX.Element {
    const [refreshCounter, setRefreshCounter] = useState(BigInt(0));
    const loadedOnce = useRef(false);
    const [tokenAccounts, setTokenAccounts] = useState<TokenAccountsContextValue>(null);
    const sdk = useSDK();
    const tokenList = useTokenList();
    const { publicKey } = useWallet();

    const fetchAndLoadTokenAccounts = useCallback(
        async (abortSignal: AbortSignal) => {
            if (!publicKey) {
                loadedOnce.current = false;
                setTokenAccounts(null);
                return;
            }

            if (!loadedOnce.current) {
                setTokenAccounts({ loading: true });
            }

            console.log('Fetching token accounts');
            const [rawTokenAccounts, rawToken2022Accounts] = await Promise.all([
                sdk.connection.getTokenAccountsByOwner(publicKey, {
                    programId: TOKEN_PROGRAM_ID,
                }),
                sdk.connection.getTokenAccountsByOwner(publicKey, {
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
            ]);

            const tokenMints = rawTokenAccounts.value.map((rawTokenAccount) => {
                const decodedTokenAccount = unpackAccount(
                    rawTokenAccount.pubkey,
                    rawTokenAccount.account,
                    TOKEN_PROGRAM_ID
                );

                return decodedTokenAccount.mint;
            });

            const token2022Mints = rawToken2022Accounts.value.map((rawTokenAccount) => {
                const decodedTokenAccount = unpackAccount(
                    rawTokenAccount.pubkey,
                    rawTokenAccount.account,
                    TOKEN_2022_PROGRAM_ID
                );

                return decodedTokenAccount.mint;
            });

            let tokenMintAccountInfos: ({ pubkey: PublicKey } & AccountInfo<Buffer>)[] = [];
            let token2022MintAccountInfos: ({ pubkey: PublicKey } & AccountInfo<Buffer>)[] = [];

            for (let i = 0; i < Math.ceil(Math.max(tokenMints.length, token2022Mints.length) / 100); i++) {
                const tokenMintsPage = tokenMints.slice(i * 100, (i + 1) * 100);
                const token2022MintsPage = token2022Mints.slice(i * 100, (i + 1) * 100);
                const [tokenMintPageAccountInfos, token2022MintPageAccountInfos] = await Promise.all([
                    sdk.connection.getMultipleAccountsInfo(tokenMintsPage),
                    sdk.connection.getMultipleAccountsInfo(token2022MintsPage),
                ]);

                tokenMintAccountInfos.push(
                    ...tokenMintPageAccountInfos
                        .map((x, i) => {
                            (x as (typeof tokenMintAccountInfos)[number]).pubkey = tokenMintsPage[i];
                            return x as (typeof tokenMintAccountInfos)[number];
                        })
                        .filter((x): x is (typeof tokenMintAccountInfos)[number] => !!x)
                );

                token2022MintAccountInfos.push(
                    ...token2022MintPageAccountInfos
                        .map((x, i) => {
                            (x as (typeof token2022MintAccountInfos)[number]).pubkey = token2022MintsPage[i];
                            return x as (typeof token2022MintAccountInfos)[number];
                        })
                        .filter((x): x is (typeof token2022MintAccountInfos)[number] => !!x)
                );
            }

            const tokenMintAccounts = tokenMintAccountInfos.map((accountInfo) =>
                unpackMint(accountInfo.pubkey, accountInfo, TOKEN_PROGRAM_ID)
            );

            const token2022MintAccounts = token2022MintAccountInfos.map((accountInfo) =>
                unpackMint(accountInfo.pubkey, accountInfo, TOKEN_2022_PROGRAM_ID)
            );

            const tokenMintMap = tokenMintAccounts.reduce((map, mint) => {
                map[mint.address.toBase58()] = mint;
                return map;
            }, {} as Record<string, Mint>);

            const token2022MintMap = token2022MintAccounts.reduce((map, mint) => {
                map[mint.address.toBase58()] = mint;
                return map;
            }, {} as Record<string, Mint>);

            const tokenAccounts = rawTokenAccounts.value.map((rawTokenAccount) => {
                const decodedTokenAccount = unpackAccount(
                    rawTokenAccount.pubkey,
                    rawTokenAccount.account,
                    TOKEN_PROGRAM_ID
                );

                const token = tokenList.allMap[decodedTokenAccount.mint.toBase58()];

                const tokenAccount: TokenAccount = {
                    tokenOrMint: token
                        ? { type: 'token', token }
                        : { mint: tokenMintMap[decodedTokenAccount.mint.toBase58()], type: 'mint' },
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
                    tokenOrMint: token
                        ? { type: 'token', token }
                        : { mint: token2022MintMap[decodedTokenAccount.mint.toBase58()], type: 'mint' },
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

            if (abortSignal.aborted) return;

            setTokenAccounts({
                loading: false,
                tokenAccounts: allTokenAccountsWithMetadata.concat(allTokenAccountsWithoutMetadata),
                triggerRefresh: () => {
                    if (!abortSignal.aborted) {
                        setRefreshCounter((c) => c + BigInt(1));
                    }
                },
            });
            loadedOnce.current = true;
        },
        [sdk, tokenList, publicKey?.toBase58()]
    );

    useEffect(() => {
        const abortController = new AbortController();
        fetchAndLoadTokenAccounts(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [fetchAndLoadTokenAccounts, refreshCounter]);

    return <TokenAccountsContext.Provider value={tokenAccounts}>{children}</TokenAccountsContext.Provider>;
}

export function useTokenAccounts(): TokenAccountsContextValue {
    return useContext(TokenAccountsContext);
}
