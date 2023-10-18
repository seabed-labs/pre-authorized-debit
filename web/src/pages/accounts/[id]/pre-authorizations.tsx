import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { usePreAuthorizations } from '../../../contexts/PreAuthorizations';
import {
    Code,
    VStack,
    Text,
    Button,
    HStack,
    Image,
    Center,
    Spinner,
    useColorModeValue,
    useToast,
    Link,
} from '@chakra-ui/react';
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
import { I64_MAX, RecurringPreAuthorizationAccount } from '@seabed-labs/pre-authorized-debit';
import { Message, PublicKey, Transaction, VersionedMessage, VersionedTransaction } from '@solana/web3.js';
import { makeExplorerLink } from '../../../utils/explorer';
import { Mint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, createRevokeInstruction } from '@solana/spl-token';

function formatTokenAmount(token: Token, amount: bigint): string {
    return new Decimal(amount.toString()).div(new Decimal(10).pow(token.decimals)).toString() + ' ' + token.symbol;
}

function formatTokenAmountWithMint(mint: Mint, amount: bigint): string {
    return new Decimal(amount.toString()).div(new Decimal(10).pow(mint.decimals)).toString();
}

function computeCurrentCycle(preAuthorization: RecurringPreAuthorizationAccount): number {
    const now = BigInt(Math.floor(new Date().getTime() / 1e3));
    const start = preAuthorization.activationUnixTimestamp;
    const frequencyInSeconds = preAuthorization.variant.repeatFrequencySeconds;
    if (start >= now) {
        return 1;
    }

    return 1 + Number((now - start) / frequencyInSeconds);
}

function computeExpiryDate(preAuthorization: RecurringPreAuthorizationAccount): Date | null {
    const start = preAuthorization.activationUnixTimestamp;
    const frequencyInSeconds = preAuthorization.variant.repeatFrequencySeconds;
    const numCycles = preAuthorization.variant.numCycles;

    if (numCycles == null) return null;

    return new Date(Number(start + frequencyInSeconds * numCycles) * 1e3);
}

const Pads: NextPage = () => {
    const router = useRouter();
    const [refreshingSmartDelegate, setRefreshingSmartDelegate] = useState(false);
    const [disconnectingSmartDelegate, setDisconnectingSmartDelegate] = useState(false);
    const [closingPreAuth, setClosingPreAuth] = useState<PublicKey | null>(null);
    const [pausingPreAuth, setPausingPreAuth] = useState<PublicKey | null>(null);
    const [unpausingPreAuth, setUnpausingPreAuth] = useState<PublicKey | null>(null);
    const preAuthorizations = usePreAuthorizations();
    const wallet = useWallet();
    const sdk = useSDK();
    const tokenAccounts = useTokenAccounts();
    const tokenAccountPubkey = router.query.id!;
    assert(typeof tokenAccountPubkey === 'string');
    const toast = useToast();

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

            toast({
                position: 'top-right',
                isClosable: true,
                duration: 5000,
                title: 'Refresh Smart Delegate Success',
                description: (
                    <Link isExternal href={makeExplorerLink(txSig)}>
                        View Transaction
                    </Link>
                ),
                status: 'success',
            });
        } catch (err) {
            console.error('Refresh Smart Delegate TX Failed:', err);
            toast({
                position: 'top-right',
                duration: 5000,
                isClosable: true,
                title: 'Refresh Smart Delegate Failed',
                description: (err as Error).message,
                status: 'error',
            });
        }

        setRefreshingSmartDelegate(false);
    }, [sdk, tokenAccount, tokenAccounts, wallet]);

    const disconnectSmartDelegate = useCallback(async () => {
        if (!tokenAccount?.address || tokenAccounts?.loading || !wallet.publicKey) return;

        setDisconnectingSmartDelegate(true);

        try {
            const ix = createRevokeInstruction(
                tokenAccount.address,
                wallet.publicKey,
                undefined,
                tokenAccount.program === 'spl-token' ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID
            );

            const latestBlockhash = await sdk.connection.getLatestBlockhash();

            const tx = new Transaction({ ...latestBlockhash }).add(ix);
            tx.feePayer = wallet.publicKey;

            const versionedTx = new VersionedTransaction(tx.compileMessage());
            const txSig = await wallet.sendTransaction(versionedTx, sdk.connection);
            const blockhash = await sdk.connection.getLatestBlockhash();
            await sdk.connection.confirmTransaction({ signature: txSig, ...blockhash });
            await delay(500);

            tokenAccounts?.triggerRefresh();

            toast({
                position: 'top-right',
                duration: 5000,
                title: 'Disconnect Smart Delegate Success',
                isClosable: true,
                description: (
                    <Link isExternal href={makeExplorerLink(txSig)}>
                        View Transaction
                    </Link>
                ),
                status: 'success',
            });
        } catch (err) {
            console.error('Refresh Smart Delegate TX Failed:', err);
            toast({
                position: 'top-right',
                isClosable: true,
                duration: 5000,
                title: 'Disconnect Smart Delegate Failed',
                description: (err as Error).message,
                status: 'error',
            });
        }

        setDisconnectingSmartDelegate(false);
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
                toast({
                    position: 'top-right',
                    duration: 5000,
                    isClosable: true,
                    title: 'Close Pre-Authorization Success',
                    description: (
                        <Link isExternal href={makeExplorerLink(txSig)}>
                            View Transaction
                        </Link>
                    ),
                    status: 'success',
                });
            } catch (err) {
                console.error('Closing Pre-Auth TX Failed:', err);
                toast({
                    position: 'top-right',
                    duration: 5000,
                    isClosable: true,
                    title: 'Close Pre-Authorization Failed',
                    description: (err as Error).message,
                    status: 'error',
                });
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
                toast({
                    position: 'top-right',
                    duration: 5000,
                    isClosable: true,
                    title: 'Pause Pre-Authorization Success',
                    description: (
                        <Link isExternal href={makeExplorerLink(txSig)}>
                            View Transaction
                        </Link>
                    ),
                    status: 'success',
                });
            } catch (err) {
                console.error('Pausing Pre-Auth TX Failed:', err);
                toast({
                    position: 'top-right',
                    duration: 5000,
                    isClosable: true,
                    title: 'Pause Pre-Authorization Failed',
                    description: (err as Error).message,
                    status: 'error',
                });
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
                toast({
                    position: 'top-right',
                    duration: 5000,
                    title: 'Unpause Pre-Authorization Success',
                    isClosable: true,
                    description: (
                        <Link isExternal href={makeExplorerLink(txSig)}>
                            View Transaction
                        </Link>
                    ),
                    status: 'success',
                });
            } catch (err) {
                console.error('Pausing Pre-Auth TX Failed:', err);
                toast({
                    position: 'top-right',
                    duration: 5000,
                    title: 'Unpause Pre-Authorization Failed',
                    isClosable: true,
                    description: (err as Error).message,
                    status: 'error',
                });
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
    const mint = tokenAccount.tokenOrMint.type === 'mint' ? tokenAccount.tokenOrMint.mint : null;
    const decimals = token?.decimals ?? mint?.decimals ?? 0;

    const tokenAmount = new Decimal(tokenAccount.amount.toString()).div(new Decimal(10).pow(decimals));

    const delegatedAmount = new Decimal(tokenAccount.delegatedAmount.toString()).div(new Decimal(10).pow(decimals));

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
                        <Text fontSize="lg">{decimals}</Text>
                    </HStack>
                    <HStack>
                        <Text fontSize="lg">Balance:</Text>
                        <Text fontSize="lg">{tokenAmount.toString()}</Text>
                        <Text fontSize="lg">{token.symbol}</Text>
                    </HStack>
                </VStack>
            ) : (
                <VStack align="start">
                    <HStack>
                        <Text fontSize="lg">Decimals:</Text>
                        <Text fontSize="lg">{decimals}</Text>
                    </HStack>
                    <HStack>
                        <Text fontSize="lg">Balance:</Text>
                        <Text fontSize="lg">{tokenAmount.toString()}</Text>
                    </HStack>
                </VStack>
            )}
            <HStack>
                <Text fontSize="lg">Delegate:</Text>
                <Code fontSize="lg">{tokenAccount.delegate?.toBase58() ?? 'None'}</Code>
                {token && delegatedAmount ? (
                    <VStack align="start">
                        <HStack>
                            <Text fontSize="lg">with delegated amount:</Text>
                            <Text fontSize="lg">{delegatedAmount.toString()}</Text>
                            <Text fontSize="lg">{token.symbol}</Text>
                        </HStack>
                    </VStack>
                ) : (
                    <VStack align="start">
                        <HStack>
                            <Text fontSize="lg">with delegated amount:</Text>
                            <Text fontSize="lg">{delegatedAmount.toString()}</Text>
                        </HStack>
                    </VStack>
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
                <Button
                    isDisabled={disconnectingSmartDelegate || !isSmartDelegateConnected}
                    onClick={disconnectSmartDelegate}
                >
                    {'Disconnect Smart Delegate (Globally pause all pre-authorizations for this token account)'}
                    {disconnectingSmartDelegate && <Spinner ml="8px" />}
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
                                    ) : mint ? (
                                        <>
                                            <HStack>
                                                <Text>Authorized Amount:</Text>
                                                <Text>
                                                    {formatTokenAmountWithMint(
                                                        mint,
                                                        preAuth.account.variant.amountAuthorized
                                                    )}
                                                </Text>
                                            </HStack>
                                            <HStack>
                                                <Text>Amount Debited:</Text>
                                                <Text>
                                                    {formatTokenAmountWithMint(
                                                        mint,
                                                        preAuth.account.variant.amountDebited
                                                    )}
                                                </Text>
                                            </HStack>
                                        </>
                                    ) : (
                                        <>
                                            <HStack>
                                                <Text>Raw Authorized Amount:</Text>
                                                <Code>{preAuth.account.variant.amountAuthorized.toString()}</Code>
                                            </HStack>
                                            <HStack>
                                                <Text>Raw Amount Debited:</Text>
                                                <Code>{preAuth.account.variant.amountDebited.toString()}</Code>
                                            </HStack>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <HStack>
                                        <Text>Type:</Text>
                                        <Text>Recurring</Text>
                                    </HStack>
                                    <HStack>
                                        <Text>{'Cycle Repeat Frequency (Seconds):'}</Text>
                                        <Text>{preAuth.account.variant.repeatFrequencySeconds.toString()} seconds</Text>
                                    </HStack>
                                    <HStack>
                                        <Text>Cycle Limit:</Text>
                                        <Text>{preAuth.account.variant.numCycles?.toString() ?? 'N/A'} cycles</Text>
                                    </HStack>
                                    <HStack>
                                        <Text>{'Expiry (computed):'}</Text>
                                        <Text>
                                            {computeExpiryDate(
                                                preAuth.account as RecurringPreAuthorizationAccount
                                            )?.toLocaleString() ?? 'N/A'}
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <Text>Amount Resets Every Cycle:</Text>
                                        <Text>{preAuth.account.variant.resetEveryCycle ? 'Yes' : 'No'}</Text>
                                    </HStack>
                                    <HStack>
                                        <Text>Current Cycle:</Text>
                                        <Text>
                                            {computeCurrentCycle(preAuth.account as RecurringPreAuthorizationAccount)}
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <Text>Last Debited Cycle:</Text>
                                        <Text>{preAuth.account.variant.lastDebitedCycle.toString()}</Text>
                                    </HStack>
                                    {token ? (
                                        <>
                                            <HStack>
                                                <Text>Recurring Authorized Amount:</Text>
                                                <Text>
                                                    {formatTokenAmount(
                                                        token,
                                                        preAuth.account.variant.recurringAmountAuthorized
                                                    )}
                                                </Text>
                                            </HStack>
                                            <HStack>
                                                <Text>Amount Debited Total:</Text>
                                                <Text>
                                                    {formatTokenAmount(
                                                        token,
                                                        preAuth.account.variant.amountDebitedTotal
                                                    )}
                                                </Text>
                                            </HStack>
                                            <HStack>
                                                <Text>Amount Debited Last Cycle:</Text>
                                                <Text>
                                                    {formatTokenAmount(
                                                        token,
                                                        preAuth.account.variant.amountDebitedLastCycle
                                                    )}
                                                </Text>
                                            </HStack>
                                        </>
                                    ) : mint ? (
                                        <>
                                            <HStack>
                                                <Text>Recurring Authorized Amount:</Text>
                                                <Text>
                                                    {formatTokenAmountWithMint(
                                                        mint,
                                                        preAuth.account.variant.recurringAmountAuthorized
                                                    )}
                                                </Text>
                                            </HStack>
                                            <HStack>
                                                <Text>Amount Debited Total:</Text>
                                                <Text>
                                                    {formatTokenAmountWithMint(
                                                        mint,
                                                        preAuth.account.variant.amountDebitedTotal
                                                    )}
                                                </Text>
                                            </HStack>
                                            <HStack>
                                                <Text>Amount Debited Last Cycle:</Text>
                                                <Text>
                                                    {formatTokenAmountWithMint(
                                                        mint,
                                                        preAuth.account.variant.amountDebitedLastCycle
                                                    )}
                                                </Text>
                                            </HStack>
                                        </>
                                    ) : (
                                        <>
                                            <HStack>
                                                <Text>{'Recurring Authorized Amount (raw):'}</Text>
                                                <Code>
                                                    {preAuth.account.variant.recurringAmountAuthorized.toString()}
                                                </Code>
                                            </HStack>
                                            <HStack>
                                                <Text>{'Amount Debited Last Cycle (raw):'}</Text>
                                                <Code>{preAuth.account.variant.amountDebitedLastCycle.toString()}</Code>
                                            </HStack>
                                            <HStack>
                                                <Text>{'Amount Debited Total (raw):'}</Text>
                                                <Code>{preAuth.account.variant.amountDebitedTotal.toString()}</Code>
                                            </HStack>
                                        </>
                                    )}
                                </>
                            )}
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
