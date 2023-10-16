import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { InferGetServerSidePropsType } from 'next';
import { getServerSideProps } from '../shared/getServerSideProps';

export interface Token {
    address: string;
    decimals: number;
    name: string;
    symbol: string;
    logoURI: string;
}

export interface TokenListContextValue {
    strict: Token[];
    all: Token[];
}

export const TokenListContext = createContext<TokenListContextValue>({
    strict: [],
    all: [],
});

export default function TokenListContextProvider({
    children,
    strict,
    all,
}: PropsWithChildren<InferGetServerSidePropsType<typeof getServerSideProps>>): JSX.Element {
    const tokenList = useMemo(() => ({ strict, all }), [strict, all]);

    return <TokenListContext.Provider value={tokenList}>{children}</TokenListContext.Provider>;
}

export function useTokenList(): TokenListContextValue {
    return useContext(TokenListContext);
}
