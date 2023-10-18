import { PropsWithChildren, createContext, useContext, useMemo, useRef } from 'react';
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
    const tokenList = useRef({ strict, all, strictMap, allMap });

    return <TokenListContext.Provider value={tokenList.current}>{children}</TokenListContext.Provider>;
}

export function useTokenList(): TokenListContextValue {
    return useContext(TokenListContext);
}
