import { useWallet } from '@solana/wallet-adapter-react';
import type { NextPage } from 'next';
import React, { useCallback, useEffect } from 'react';
import { useSDK } from '../contexts/SDK';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useTokenList } from '../contexts/TokenList';
import { useTokenAccounts } from '../contexts/TokenAccounts';

// interface TokenAccountProps {}

// function TokenAccount({}: TokenAccountProps) {}

const Home: NextPage = () => {
    const tokenAccounts = useTokenAccounts();

    useEffect(() => {
        console.log('Token Accounts:', tokenAccounts);
    }, [tokenAccounts]);

    return <>Home</>;
};

export { getServerSideProps } from '../shared/getServerSideProps';

export default Home;
