import type { NextPage } from 'next';
import React from 'react';
import { TokenAccount, useTokenAccounts } from '../contexts/TokenAccounts';
import { Box, Center, Code, Flex, HStack, Image, Spinner, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import Decimal from 'decimal.js';
import { IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';
import { usePreAuthorizations } from '../contexts/PreAuthorizations';
import { useSDK } from '../contexts/SDK';
import { CheckCircleIcon, CloseIcon } from '@chakra-ui/icons';

interface TokenAccountProps {
    tokenAccount: TokenAccount;
}

// TODOs:
// 1. Toast messages during TXs

function TokenAccount({ tokenAccount }: TokenAccountProps) {
    const token = tokenAccount.tokenOrMint.type === 'token' ? tokenAccount.tokenOrMint.token : null;
    const tokenOrMint = tokenAccount.tokenOrMint;
    const tokenDecimals = tokenOrMint.type === 'token' ? tokenOrMint.token.decimals : tokenOrMint.mint.decimals;
    const tokenAmount = new Decimal(tokenAccount.amount.toString()).div(new Decimal(10).pow(tokenDecimals));

    const bgColor = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
    const sdk = useSDK();

    const preAuthorizations = usePreAuthorizations();

    const preAuthorizationsCount =
        preAuthorizations && !preAuthorizations.loading
            ? preAuthorizations.listByTokenAccount[tokenAccount.address.toBase58()]?.length
            : null;

    const isSmartDelegateConnected =
        tokenAccount.delegate && tokenAccount.delegate.equals(sdk.readClient.getSmartDelegatePDA().publicKey);

    const checkColor = useColorModeValue('green', 'aqua');

    return (
        <Flex
            bgColor={bgColor}
            my="10px"
            py="10px"
            px="10px"
            w="100%"
            maxW="720px"
            direction="row"
            alignItems="center"
            justifyContent="space-between"
        >
            <VStack w="100%">
                {token && tokenAmount ? (
                    <HStack w="100%" justifyContent="space-between">
                        <HStack m="0" justifyContent="flex-start">
                            {token.logoURI && <Image height="8" width="8" src={token.logoURI} alt="Token Icon" />}
                            <Text>{token.symbol}</Text>
                        </HStack>
                        <HStack>
                            <Text>{`Balance: ${tokenAmount.toString()}`}</Text>
                        </HStack>
                    </HStack>
                ) : (
                    <HStack w="100%" justifyContent="space-between">
                        <HStack m="0" justifyContent="flex-start">
                            <Text>Unknown Token</Text>
                        </HStack>
                        <HStack>
                            <Text>{`Balance: ${tokenAmount.toString()}`}</Text>
                        </HStack>
                    </HStack>
                )}
                <HStack w="100%" justifyContent="space-between">
                    {preAuthorizationsCount != null ? (
                        <Text>{`Pre-Authorizations: ${preAuthorizationsCount}`}</Text>
                    ) : (
                        <Text>Pre-Authorizations: Loading</Text>
                    )}
                    {isSmartDelegateConnected ? (
                        <HStack>
                            <Text>Smart Delegate Connected</Text>
                            <CheckCircleIcon color={checkColor} />
                        </HStack>
                    ) : (
                        <HStack>
                            <Text>Smart Delegate Disconnected</Text>
                            <CloseIcon color="red" />
                        </HStack>
                    )}
                </HStack>
                <HStack w="100%" justifyContent="space-between">
                    <HStack>
                        <Text>Mint</Text>
                        <Code>{tokenAccount.mint.toBase58()}</Code>
                    </HStack>
                    <HStack>
                        <Text>Raw Balance</Text>
                        <Code>{tokenAccount.amount.toString()}</Code>
                    </HStack>
                </HStack>
                <HStack w="100%" justifyContent="space-between">
                    <HStack>
                        <Text>Address</Text>
                        <Code>{tokenAccount.address.toBase58()}</Code>
                    </HStack>
                    <Link href={`/accounts/${tokenAccount.address.toBase58()}/pre-authorizations`}>
                        <HStack fontWeight="bold" cursor="pointer" _hover={{ opacity: 0.5 }}>
                            <Text>Manage Account</Text>
                            <IconArrowRight />
                        </HStack>
                    </Link>
                </HStack>
            </VStack>
        </Flex>
    );
}

const Home: NextPage = () => {
    const tokenAccounts = useTokenAccounts();

    if (!tokenAccounts) {
        return (
            <Center h="100%" w="calc(100vw - 264px)" fontSize="20px">
                Connect wallet to see token accounts
            </Center>
        );
    }

    if (tokenAccounts.loading) {
        return (
            <Center h="100%" w="calc(100vw - 264px)" fontSize="16px">
                <VStack spacing="12px">
                    <Spinner size="lg" />
                    <Text>Loading Token Accounts</Text>
                </VStack>
            </Center>
        );
    }

    return (
        <VStack h="100vh" justifyContent="flex-start" overflow="scroll" w="calc(100vw - 264px)">
            <Center mb="16px" mt="20px">
                <Text fontSize="4xl" fontWeight="semibold">
                    Token Accounts
                </Text>
            </Center>
            {tokenAccounts.tokenAccounts.length === 0 && <Text>{"You don't have any token accounts"}</Text>}
            <VStack w="100%" spacing="16px" justifyContent="flex-start" alignItems="center">
                {tokenAccounts.tokenAccounts.map((tokenAccount) => (
                    <TokenAccount key={tokenAccount.address.toBase58()} tokenAccount={tokenAccount} />
                ))}
            </VStack>
        </VStack>
    );
};

export { getServerSideProps } from '../shared/getServerSideProps';

export default Home;
