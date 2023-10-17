import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { usePreAuthorizations } from '../../../contexts/PreAuthorizations';
import { Code, VStack, Text, Button, HStack, Image, Center, Spinner } from '@chakra-ui/react';
import { CheckCircleIcon, CloseIcon } from '@chakra-ui/icons';
import { useTokenAccounts } from '../../../contexts/TokenAccounts';
import { useCallback, useMemo, useState } from 'react';
import Decimal from 'decimal.js';
import { useSDK } from '../../../contexts/SDK';
import { useWallet } from '@solana/wallet-adapter-react';
import { delay } from '../../../utils/delay';

const Pads: NextPage = () => {
    const router = useRouter();
    const [refreshingSmartDelegate, setRefreshingSmartDelegate] = useState(false);
    const preAuthorizations = usePreAuthorizations();
    const wallet = useWallet();
    const sdk = useSDK();
    const tokenAccounts = useTokenAccounts();
    const tokenAccountPubkey = router.query.id;

    const tokenAccount = useMemo(() => {
        if (!tokenAccounts || tokenAccounts.loading) {
            return null;
        }

        return tokenAccounts.tokenAccounts.find((a) => a.address.toBase58() === tokenAccountPubkey) ?? null;
    }, [tokenAccounts, tokenAccountPubkey]);

    const refreshSmartDelegate = useCallback(async () => {
        if (!tokenAccount?.address || tokenAccounts?.loading) return;

        setRefreshingSmartDelegate(true);

        const tx = await (
            await sdk.txFactory.buildApproveSmartDelegateTx({
                tokenAccount: tokenAccount.address,
            })
        ).buildVersionedTransaction({
            txFeesPayer: wallet.publicKey!,
        });

        try {
            const txSig = await wallet.sendTransaction(tx, sdk.connection);
            const blockhash = await sdk.connection.getLatestBlockhash();
            await sdk.connection.confirmTransaction({ signature: txSig, ...blockhash });
            await delay(500);

            tokenAccounts?.triggerRefresh();
        } catch (err) {
            console.error('Refresh Smart Delegate TX Failed:', err);
        }

        setRefreshingSmartDelegate(false);
    }, [sdk, tokenAccount, tokenAccounts, wallet]);

    if (tokenAccounts?.loading) {
        return (
            <Center h="100vh" w="calc(100vw - 264px)">
                <VStack>
                    <Spinner size="xl" />
                    <Text mt="10px" size="lg">
                        Loading Token Accounts
                    </Text>
                </VStack>
            </Center>
        );
    }

    if (!tokenAccount) {
        return (
            <VStack w="calc(100vw - 264px)" justifyContent="flex-start">
                <Text>Token Account Not Found</Text>
                <Code>{tokenAccountPubkey}</Code>
            </VStack>
        );
    }

    const token = tokenAccount.tokenOrMint.type === 'token' ? tokenAccount.tokenOrMint.token : null;

    const tokenAmount = token
        ? new Decimal(tokenAccount.amount.toString()).div(new Decimal(10).pow(token.decimals))
        : null;

    const delegatedAmount = token
        ? new Decimal(tokenAccount.delegatedAmount.toString()).div(new Decimal(10).pow(token.decimals))
        : null;

    const isSmartDelegateConnected =
        tokenAccount.delegate && tokenAccount.delegate.equals(sdk.readClient.getSmartDelegatePDA().publicKey);

    return (
        <VStack
            py="24px"
            w="calc(100vw - 264px)"
            h="100vh"
            overflow="scroll"
            justifyContent="flex-start"
            alignItems="start"
        >
            <HStack align="center">
                {token ? (
                    <HStack>
                        <Image height="12" src={token.logoURI} alt="Token Icon" />
                        <Text fontSize="4xl" fontWeight="semibold">
                            {token.symbol}
                        </Text>
                    </HStack>
                ) : (
                    <Text fontSize="4xl" fontWeight="semibold">
                        Unknown
                    </Text>
                )}
                <Text fontSize="4xl" fontWeight="semibold">
                    Token Account
                </Text>
            </HStack>
            <HStack>
                <Text fontSize="lg">Address:</Text>
                <Code fontSize="lg">{tokenAccountPubkey}</Code>
            </HStack>
            <HStack>
                <Text fontSize="lg">Mint:</Text>
                <Code fontSize="lg">{tokenAccount.mint.toBase58()}</Code>
            </HStack>
            {token && tokenAmount ? (
                <VStack align="start">
                    <HStack>
                        <Text fontSize="lg">Decimals:</Text>
                        <Text fontSize="lg">{token.decimals}</Text>
                    </HStack>
                    <HStack>
                        <Text fontSize="lg">Balance:</Text>
                        <Text fontSize="lg">{tokenAmount.toString()}</Text>
                        <Text fontSize="lg">{token.symbol}</Text>
                    </HStack>
                </VStack>
            ) : (
                <HStack>
                    <Text fontSize="lg">Raw Balance:</Text>
                    <Code fontSize="lg">{tokenAccount.amount.toString()}</Code>
                </HStack>
            )}
            <HStack>
                <Text fontSize="lg">Delegate:</Text>
                <Code fontSize="lg">{tokenAccount.delegate?.toBase58() ?? 'None'}</Code>
                {token && delegatedAmount ? (
                    <HStack>
                        <Text fontSize="lg">with delegated amount:</Text>
                        <Text fontSize="lg">{delegatedAmount.toString()}</Text>
                        <Text fontSize="lg">{token.symbol}</Text>
                    </HStack>
                ) : (
                    <HStack>
                        <Text fontSize="lg">with delegated raw amount:</Text>
                        <Code fontSize="lg">{tokenAccount.delegatedAmount.toString()}</Code>
                    </HStack>
                )}
            </HStack>
            {isSmartDelegateConnected ? (
                <HStack fontSize="lg">
                    <CheckCircleIcon color="aquamarine" />
                    <Text>
                        Smart Delegate connected{' '}
                        {'(All pre-authorizations active; refresh below to reset delegated amount to maximum)'}
                    </Text>
                </HStack>
            ) : (
                <HStack fontSize="lg">
                    <CloseIcon color="red" />
                    <Text>
                        Smart Delegate not connected {'(All pre-authorizations inactive; refresh below to connect)'}
                    </Text>
                </HStack>
            )}
            <Button isDisabled={refreshingSmartDelegate} onClick={refreshSmartDelegate}>
                Refresh Smart Delegate
                {refreshingSmartDelegate && <Spinner ml="8px" />}
            </Button>
            <HStack>
                <Button>Create Pre-Authorization</Button>
            </HStack>
        </VStack>
    );

    return <>Inner Pads for Token Account {router.query.id}</>;
};

export { getServerSideProps } from '../../../shared/getServerSideProps';

export default Pads;
