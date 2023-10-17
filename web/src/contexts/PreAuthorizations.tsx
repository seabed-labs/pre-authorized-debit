import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PreAuthorizationAccount } from '@seabed-labs/pre-authorized-debit';
import { useTokenAccounts } from './TokenAccounts';
import { useSDK } from './SDK';
import { PublicKey } from '@solana/web3.js';
import { delay } from '../utils/delay';

interface ProgramAccount<T> {
    publicKey: PublicKey;
    account: T;
}

export type PreAuthorizations = {
    list: ProgramAccount<PreAuthorizationAccount>[];
    map: Partial<Record<string, ProgramAccount<PreAuthorizationAccount>>>;
    listByTokenAccount: Partial<Record<string, ProgramAccount<PreAuthorizationAccount>[]>>;
};

export type PreAuthorizationsContextValue = (PreAuthorizations & { loading: false }) | { loading: true } | null;

export const PreAuthorizationsContext = createContext<PreAuthorizationsContextValue>(null);

export default function PreAuthorizationsContextProvider({ children }: PropsWithChildren): JSX.Element {
    const loadedOnce = useRef(false);
    const [value, setValue] = useState<PreAuthorizationsContextValue>(null);
    const sdk = useSDK();
    const tokenAccountsData = useTokenAccounts();

    const fetchAndLoadPreAuthorizations = useCallback(
        async (abortSignal: AbortSignal) => {
            if (!tokenAccountsData) {
                loadedOnce.current = false;
                setValue(null);
                return;
            }

            if (tokenAccountsData.loading) {
                setValue({ loading: true });
                return;
            } else if (!loadedOnce.current) {
                setValue({ loading: true });
            }

            const { tokenAccounts } = tokenAccountsData;

            const preAuthorizationsList: PreAuthorizations['list'] = [];
            const preAuthorizationsListByTokenAccount: PreAuthorizations['listByTokenAccount'] = {};
            const preAuthorizationsMap: PreAuthorizations['map'] = {};

            console.log('Fetching Pre-Auths');
            for (const tokenAccount of tokenAccounts) {
                if (abortSignal.aborted) return;

                let preAuthorizations: ProgramAccount<PreAuthorizationAccount>[] = [];
                try {
                    preAuthorizations = await sdk.readClient.fetchPreAuthorizationsForTokenAccount(
                        tokenAccount.address,
                        'all'
                    );
                } catch (err) {
                    console.error('Error during Pre-Auth fetching:', err);
                }
                preAuthorizationsListByTokenAccount[tokenAccount.address.toBase58()] = preAuthorizations;

                for (const preAuthorization of preAuthorizations) {
                    preAuthorizationsList.push(preAuthorization);
                    preAuthorizationsMap[preAuthorization.publicKey.toBase58()] = preAuthorization;
                }

                await delay(200);
            }

            if (abortSignal.aborted) return;

            setValue({
                loading: false,
                list: preAuthorizationsList,
                listByTokenAccount: preAuthorizationsListByTokenAccount,
                map: preAuthorizationsMap,
            });

            loadedOnce.current = true;
        },
        [tokenAccountsData, sdk]
    );

    useEffect(() => {
        const abortController = new AbortController();
        fetchAndLoadPreAuthorizations(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [fetchAndLoadPreAuthorizations]);

    return <PreAuthorizationsContext.Provider value={value}>{children}</PreAuthorizationsContext.Provider>;
}

export function usePreAuthorizations(): PreAuthorizationsContextValue {
    return useContext(PreAuthorizationsContext);
}
