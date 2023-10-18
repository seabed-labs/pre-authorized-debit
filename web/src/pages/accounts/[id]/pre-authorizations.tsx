import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { usePreAuthorizations } from '../../../contexts/PreAuthorizations';
import { Code, VStack, Text, Button, HStack, Image, Center, Spinner, useColorModeValue } from '@chakra-ui/react';
import { CheckCircleIcon, CloseIcon } from '@chakra-ui/icons';
import { useTokenAccounts } from '../../../contexts/TokenAccounts';
import { useCallback, useMemo, useState } from 'react';
import Decimal from 'decimal.js';
import { useSDK } from '../../../contexts/SDK';
import { useWallet } from '@solana/wallet-adapter-react';
import { delay } from '../../../utils/delay';
import CreatePreAuthorizationModal from '../../../components/CreatePreAuthorizationModal';
import assert from 'assert';
import { Token } from '../../../contexts/TokenList';
import { I64_MAX } from '@seabed-labs/pre-authorized-debit';
import { PublicKey } from '@solana/web3.js';

function formatTokenAmount(token: Token, amount: bigint): string {
    return new Decimal(amount.toString()).div(new Decimal(10).pow(token.decimals)).toString();
}

const Pads: NextPage = () => {
    const router = useRouter();
    const [refreshingSmartDelegate, setRefreshingSmartDelegate] = useState(false);
    const [closingPreAuth, setClosingPreAuth] = useState<PublicKey | null>(null);
    const [pausingPreAuth, setPausingPreAuth] = useState<PublicKey | null>(null);
    const [unpausingPreAuth, setUnpausingPreAuth] = useState<PublicKey | null>(null);
    const preAuthorizations = usePreAuthorizations();
    const wallet = useWallet();
    const sdk = useSDK();
    const tokenAccounts = useTokenAccounts();
    const tokenAccountPubkey = router.query.id!;
    assert(typeof tokenAccountPubkey === 'string');

    const checkColor = useColorModeValue('green', 'aquamarine');

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

    const bgColor = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
    const closePreAuth = useCallback(
        async (preAuth: PublicKey) => {
            if (!tokenAccount?.address || preAuthorizations?.loading) return;

            setClosingPreAuth(preAuth);

            const tx = await (
                await sdk.txFactory.buildClosePreAuthorizationAsOwnerTx({
                    preAuthorization: preAuth,
                })
            ).buildVersionedTransaction({
                txFeesPayer: wallet.publicKey!,
            });

            try {
                const txSig = await wallet.sendTransaction(tx, sdk.connection);
                const blockhash = await sdk.connection.getLatestBlockhash();
                await sdk.connection.confirmTransaction({ signature: txSig, ...blockhash });
                await delay(500);

                preAuthorizations?.triggerRefresh();
            } catch (err) {
                console.error('Closing Pre-Auth TX Failed:', err);
            }

            setClosingPreAuth(null);
        },
        [tokenAccount, preAuthorizations, sdk, wallet]
    );

    const pausePreAuth = useCallback(
        async (preAuth: PublicKey) => {
            if (!tokenAccount?.address || preAuthorizations?.loading) return;

            setPausingPreAuth(preAuth);

            const tx = await (
                await sdk.txFactory.buildPausePreAuthorizationTx({
                    preAuthorization: preAuth,
                })
            ).buildVersionedTransaction({
                txFeesPayer: wallet.publicKey!,
            });

            try {
                const txSig = await wallet.sendTransaction(tx, sdk.connection);
                const blockhash = await sdk.connection.getLatestBlockhash();
                await sdk.connection.confirmTransaction({ signature: txSig, ...blockhash });
                await delay(500);

                preAuthorizations?.triggerRefresh();
            } catch (err) {
                console.error('Pausing Pre-Auth TX Failed:', err);
            }

            setPausingPreAuth(null);
        },
        [tokenAccount, preAuthorizations, sdk, wallet]
    );

    const unpausePreAuth = useCallback(
        async (preAuth: PublicKey) => {
            if (!tokenAccount?.address || preAuthorizations?.loading) return;

            setUnpausingPreAuth(preAuth);

            const tx = await (
                await sdk.txFactory.buildUnpausePreAuthorizationTx({
                    preAuthorization: preAuth,
                })
            ).buildVersionedTransaction({
                txFeesPayer: wallet.publicKey!,
            });

            try {
                const txSig = await wallet.sendTransaction(tx, sdk.connection);
                const blockhash = await sdk.connection.getLatestBlockhash();
                await sdk.connection.confirmTransaction({ signature: txSig, ...blockhash });
                await delay(500);

                preAuthorizations?.triggerRefresh();
            } catch (err) {
                console.error('Pausing Pre-Auth TX Failed:', err);
            }

            setUnpausingPreAuth(null);
        },
        [tokenAccount, preAuthorizations, sdk, wallet]
    );

    if (!tokenAccount) {
        return (
            <VStack w="calc(100vw - 264px)" justifyContent="flex-start">
                <Text>{'Token Account Not Found (try connecting your wallet)'}</Text>
                <Code>{tokenAccountPubkey}</Code>
            </VStack>
        );
    }

    if (!tokenAccounts || tokenAccounts?.loading) {
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

    if (!preAuthorizations || preAuthorizations?.loading) {
        return (
            <Center h="100vh" w="calc(100vw - 264px)">
                <VStack>
                    <Spinner size="xl" />
                    <Text mt="10px" size="lg">
                        Loading Pre-Authorizations
                    </Text>
                </VStack>
            </Center>
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

    const preAuths = preAuthorizations.listByTokenAccount[tokenAccountPubkey];
    const preAuthCount = preAuths?.length ?? 0;

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
            <HStack>
                <Text fontSize="lg">Pre-authorizations found:</Text>
                <Text fontSize="lg">{preAuthCount}</Text>
            </HStack>
            {isSmartDelegateConnected ? (
                <HStack fontSize="lg">
                    <CheckCircleIcon color={checkColor} />
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
            <HStack>
                <Button isDisabled={refreshingSmartDelegate} onClick={refreshSmartDelegate}>
                    Refresh Smart Delegate
                    {refreshingSmartDelegate && <Spinner ml="8px" />}
                </Button>
            </HStack>
            <HStack>
                <CreatePreAuthorizationModal tokenAccount={tokenAccount} />
            </HStack>
            <VStack mt="20px" align="left">
                <Text fontSize="3xl">Pre-Authorizations</Text>
                {preAuths && preAuths.length > 0 ? (
                    preAuths.map((preAuth) => (
                        <VStack key={preAuth.publicKey.toBase58()} py="20px" px="10px" bgColor={bgColor} align="start">
                            <HStack>
                                <Text>Address:</Text>
                                <Code>{preAuth.publicKey.toBase58()}</Code>
                            </HStack>
                            <HStack>
                                <Text>Debit Authority:</Text>
                                <Code>{preAuth.account.debitAuthority.toBase58()}</Code>
                            </HStack>
                            <HStack>
                                <Text>Start Date:</Text>
                                <Text>
                                    {new Date(
                                        Number(preAuth.account.activationUnixTimestamp * BigInt(1e3))
                                    ).toLocaleString()}
                                </Text>
                            </HStack>
                            {preAuth.account.variant.type === 'oneTime' ? (
                                <>
                                    <HStack>
                                        <Text>Type:</Text>
                                        <Text>One-Time</Text>
                                    </HStack>
                                    <HStack>
                                        <Text>Expiry Date:</Text>
                                        <Text>
                                            {preAuth.account.variant.expiryUnixTimestamp === I64_MAX
                                                ? 'N/A'
                                                : new Date(
                                                      Number(preAuth.account.variant.expiryUnixTimestamp * BigInt(1e3))
                                                  ).toLocaleString()}
                                        </Text>
                                    </HStack>
                                    {token ? (
                                        <>
                                            <HStack>
                                                <Text>Authorized Amount:</Text>
                                                <Text>
                                                    {formatTokenAmount(token, preAuth.account.variant.amountAuthorized)}
                                                </Text>
                                            </HStack>
                                            <HStack>
                                                <Text>Amount Debited:</Text>
                                                <Text>
                                                    {formatTokenAmount(token, preAuth.account.variant.amountDebited)}
                                                </Text>
                                            </HStack>
                                        </>
                                    ) : null}
                                </>
                            ) : null}
                            <HStack>
                                <Text>Paused:</Text>
                                <Text>{preAuth.account.paused ? 'Yes' : 'No'}</Text>
                            </HStack>
                            <HStack>
                                <Button
                                    onClick={() => closePreAuth(preAuth.publicKey)}
                                    isDisabled={!!closingPreAuth || !!pausingPreAuth || !!unpausingPreAuth}
                                >
                                    Close {closingPreAuth?.equals(preAuth.publicKey) && <Spinner ml="10px" />}
                                </Button>
                                {preAuth.account.paused ? (
                                    <Button
                                        onClick={() => unpausePreAuth(preAuth.publicKey)}
                                        isDisabled={!!closingPreAuth || !!pausingPreAuth || !!unpausingPreAuth}
                                    >
                                        Unpause {unpausingPreAuth?.equals(preAuth.publicKey) && <Spinner ml="10px" />}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => pausePreAuth(preAuth.publicKey)}
                                        isDisabled={!!closingPreAuth || !!pausingPreAuth || !!unpausingPreAuth}
                                    >
                                        Pause {pausingPreAuth?.equals(preAuth.publicKey) && <Spinner ml="10px" />}
                                    </Button>
                                )}
                            </HStack>
                        </VStack>
                    ))
                ) : (
                    <HStack w="100%">
                        <Text>No pre-authorizations</Text>
                    </HStack>
                )}
            </VStack>
        </VStack>
    );
};

export { getServerSideProps } from '../../../shared/getServerSideProps';

export default Pads;
