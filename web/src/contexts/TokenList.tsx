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

export type TokenList = {
    strict: Token[];
    all: Token[];
    strictMap: Partial<Record<string, Token>>;
    allMap: Partial<Record<string, Token>>;
};

export interface TokenListContextValue extends TokenList {}

export const TokenListContext = createContext<TokenListContextValue>({
    strict: [],
    all: [],
    strictMap: {},
    allMap: {},
});

export default function TokenListContextProvider({
    children,
    strict,
    all,
    strictMap,
    allMap,
}: PropsWithChildren<InferGetServerSidePropsType<typeof getServerSideProps>>): JSX.Element {
    const tokenList = useMemo(() => ({ strict, all, strictMap, allMap }), [strict, all, allMap, strictMap]);

    return <TokenListContext.Provider value={tokenList}>{children}</TokenListContext.Provider>;
}

export function useTokenList(): TokenListContextValue {
    return useContext(TokenListContext);
}
