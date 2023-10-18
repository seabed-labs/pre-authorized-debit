import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    VStack,
    useDisclosure,
    Text,
    NumberInput,
    NumberInputField,
    HStack,
    Input,
    Spinner,
    Switch,
} from '@chakra-ui/react';
import { ChangeEvent, useCallback, useState } from 'react';
import { TokenAccount } from '../contexts/TokenAccounts';

import { PublicKey } from '@solana/web3.js';
import Decimal from 'decimal.js';
import { useSDK } from '../contexts/SDK';
import { useWallet } from '@solana/wallet-adapter-react';
import { delay } from '../utils/delay';
import { usePreAuthorizations } from '../contexts/PreAuthorizations';

export interface CreatePreAuthorizationModalProps {
    tokenAccount: TokenAccount;
}

function toISO(date: Date) {
    var tzo = -date.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = (num: number) => {
            return (num < 10 ? '0' : '') + num;
        };

    return (
        date.getFullYear() +
        '-' +
        pad(date.getMonth() + 1) +
        '-' +
        pad(date.getDate()) +
        'T' +
        pad(date.getHours()) +
        ':' +
        pad(date.getMinutes())
        // pad(date.getMinutes()) +
        // ':' +
        // pad(date.getSeconds()) +
        // dif +
        // pad(Math.floor(Math.abs(tzo) / 60)) +
        // ':' +
        // pad(Math.abs(tzo) % 60)
    );
}
const CreatePreAuthorizationModal: React.FC<CreatePreAuthorizationModalProps> = ({
    tokenAccount,
}: CreatePreAuthorizationModalProps) => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    const sdk = useSDK();
    const wallet = useWallet();
    const [preAuthType, setPreAuthType] = useState<'one-time' | 'recurring'>('one-time');

    const preAuthorizations = usePreAuthorizations();

    const [creating, setCreating] = useState(false);

    const [startDate, setStartDate] = useState<Date>(new Date());
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);

    const [debitAuthority, setDebitAuthority] = useState<PublicKey | null>(null);

    const [authorizedAmount, setAuthorizedAmount] = useState<Decimal>(new Decimal(0));
    const [rawAuthorizedAmount, setRawAuthorizedAmount] = useState<bigint>(BigInt(0));

    const [recurringRepeatFrequency, setRecurringRepeatFrequency] = useState<bigint>(BigInt(0));
    const [numCycles, setNumCycles] = useState<bigint>(BigInt(0));
    const [resetEveryCycle, setResetEveryCycle] = useState(false);

    const tokenOrMint = tokenAccount.tokenOrMint;
    const token = tokenOrMint.type === 'token' ? tokenOrMint.token : null;

    const onCloseWrapper = useCallback(() => {
        setPreAuthType('one-time');
        setStartDate(new Date());
        setExpiryDate(null);
        setDebitAuthority(null);
        setAuthorizedAmount(new Decimal(0));
        setRawAuthorizedAmount(BigInt(0));
        setRecurringRepeatFrequency(BigInt(0));
        setNumCycles(BigInt(0));
        setResetEveryCycle(true);
        onClose();
    }, [onClose]);

    const onStartDateChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const rawDate = e.target.value;

        try {
            const startDate = new Date(rawDate);
            setStartDate(startDate);
        } catch {}
    }, []);

    const onExpiryDateChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const rawDate = e.target.value;

        if (rawDate.trim() === '') {
            setExpiryDate(null);
            return;
        }

        try {
            const expiryDate = new Date(rawDate);
            setExpiryDate(expiryDate);
        } catch {}
    }, []);

    const onDebitAuthorityChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const debitAuthorityRaw = e.target.value;

        if (debitAuthorityRaw.trim() === '') {
            setDebitAuthority(null);
            return;
        }

        try {
            const debitAuthority = new PublicKey(debitAuthorityRaw);
            setDebitAuthority(debitAuthority);
        } catch {}
    }, []);

    const onAuthorizedAmountChange = useCallback(
        (authorizedAmountStr: string) => {
            if (authorizedAmountStr.trim() === '') {
                setAuthorizedAmount(new Decimal(0));
                return;
            }

            try {
                let authorizedAmount = new Decimal(authorizedAmountStr);
                const decimals = token!.decimals;
                authorizedAmount = authorizedAmount.toDecimalPlaces(decimals);
                setAuthorizedAmount(authorizedAmount);
            } catch {}
        },
        [token]
    );

    const onRawAuthorizedAmountChange = useCallback(
        (rawAuthorizedAmountStr: string) => {
            if (rawAuthorizedAmountStr.trim() === '') {
                setRawAuthorizedAmount(BigInt(0));
                return;
            }

            try {
                const authorizedAmount = new Decimal(rawAuthorizedAmountStr).floor();
                setRawAuthorizedAmount(BigInt(authorizedAmount.toString()));
            } catch {}
        },
        [token]
    );

    const onRepeatFrequencyChanged = useCallback(
        (val: string) => {
            if (val.trim() === '') {
                setRecurringRepeatFrequency(BigInt(0));
                return;
            }

            try {
                const repeatFrequency = new Decimal(val).floor();
                setRecurringRepeatFrequency(BigInt(repeatFrequency.toString()));
            } catch {}
        },
        [token]
    );

    const onNumCyclesChanged = useCallback(
        (val: string) => {
            if (val.trim() === '') {
                setNumCycles(BigInt(0));
                return;
            }

            try {
                const numCycles = new Decimal(val).floor();
                setNumCycles(BigInt(numCycles.toString()));
            } catch {}
        },
        [token]
    );

    const onCreateOneTimePreAuth = useCallback(async () => {
        if (!wallet.publicKey || !debitAuthority) return;

        setCreating(true);

        const rawAmount = token
            ? BigInt(authorizedAmount.mul(new Decimal(10).pow(token.decimals)).floor().toString())
            : rawAuthorizedAmount;

        try {
            const tx = await (
                await sdk.txFactory.buildInitOneTimePreAuthorizationTx({
                    payer: wallet.publicKey,
                    tokenAccount: tokenAccount.address,
                    debitAuthority: debitAuthority,
                    activation: startDate,
                    amountAuthorized: rawAmount,
                    expiry: expiryDate ?? undefined,
                })
            ).buildVersionedTransaction({ txFeesPayer: wallet.publicKey });

            const txSig = await wallet.sendTransaction(tx, sdk.connection);
            const blockhash = await sdk.connection.getLatestBlockhash();
            await sdk.connection.confirmTransaction({ signature: txSig, ...blockhash });
            await delay(500);
        } catch (err) {
            console.error('Create one-time pre-auth TX Failed:', err);
        }

        if (!preAuthorizations?.loading) {
            preAuthorizations?.triggerRefresh();
        }

        setCreating(false);
        onCloseWrapper();
    }, [
        sdk,
        wallet,
        preAuthorizations,
        debitAuthority,
        authorizedAmount,
        rawAuthorizedAmount,
        token,
        startDate,
        expiryDate,
    ]);

    const onCreateRecurringPreAuth = useCallback(async () => {
        if (!wallet.publicKey || !debitAuthority) return;

        setCreating(true);

        const rawAmount = token
            ? BigInt(authorizedAmount.mul(new Decimal(10).pow(token.decimals)).floor().toString())
            : rawAuthorizedAmount;

        try {
            const tx = await (
                await sdk.txFactory.buildInitRecurringPreAuthorizationTx({
                    payer: wallet.publicKey,
                    tokenAccount: tokenAccount.address,
                    debitAuthority: debitAuthority,
                    activation: startDate,
                    recurringAmountAuthorized: rawAmount,
                    repeatFrequencySeconds: recurringRepeatFrequency,
                    numCycles: numCycles === BigInt(0) ? null : numCycles,
                    resetEveryCycle,
                })
            ).buildVersionedTransaction({ txFeesPayer: wallet.publicKey });

            const txSig = await wallet.sendTransaction(tx, sdk.connection);
            const blockhash = await sdk.connection.getLatestBlockhash();
            await sdk.connection.confirmTransaction({ signature: txSig, ...blockhash });
            await delay(500);
        } catch (err) {
            console.error('Create recurring pre-auth TX Failed:', err);
        }

        if (!preAuthorizations?.loading) {
            preAuthorizations?.triggerRefresh();
        }

        setCreating(false);
        onCloseWrapper();
    }, [
        sdk,
        wallet,
        preAuthorizations,
        debitAuthority,
        authorizedAmount,
        rawAuthorizedAmount,
        token,
        startDate,
        recurringRepeatFrequency,
        numCycles,
        resetEveryCycle,
    ]);

    return (
        <>
            <Button onClick={onOpen}>Create Pre-Authorization</Button>

            <Modal isOpen={isOpen} onClose={onCloseWrapper}>
                <ModalOverlay />

                <ModalContent>
                    <ModalHeader>Create Pre-Authorization</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack align="start" w="100%" h="100%" spacing="16px">
                            <VStack align="start" w="100%">
                                <Text fontWeight="semibold">Pre-Authorization Type</Text>
                                <Select
                                    value={preAuthType}
                                    onChange={(e) => setPreAuthType(e.target.value as 'one-time' | 'recurring')}
                                >
                                    <option value="one-time">One-Time</option>
                                    <option value="recurring">Recurring</option>
                                </Select>
                            </VStack>
                            <VStack align="start" w="100%">
                                <Text fontWeight="semibold">Debit Authority</Text>
                                <Input
                                    value={debitAuthority?.toBase58() ?? ''}
                                    onChange={onDebitAuthorityChange}
                                    placeholder="Enter debit authority address"
                                />
                            </VStack>
                            <VStack align="start" w="100%">
                                <Text fontWeight="semibold">Start Date</Text>
                                <Input
                                    placeholder="Select start date and time"
                                    type="datetime-local"
                                    value={toISO(startDate)}
                                    onChange={onStartDateChange}
                                />
                            </VStack>
                            {preAuthType === 'one-time' ? (
                                <>
                                    <VStack align="start" w="100%">
                                        <Text fontWeight="semibold">{'End Date (optional)'}</Text>
                                        <Input
                                            placeholder="Select start date and time"
                                            type="datetime-local"
                                            value={expiryDate ? toISO(expiryDate) : ''}
                                            onChange={onExpiryDateChange}
                                        />
                                    </VStack>
                                    <VStack align="start" w="100%">
                                        {token ? (
                                            <>
                                                <Text fontWeight="semibold">Amount Authorized</Text>
                                                <HStack w="100%">
                                                    <NumberInput
                                                        value={
                                                            authorizedAmount.eq(0) ? '' : authorizedAmount.toString()
                                                        }
                                                        onChange={onAuthorizedAmountChange}
                                                        w="100%"
                                                    >
                                                        <NumberInputField placeholder="Enter amount to authorize" />
                                                    </NumberInput>
                                                    <Text>{token.symbol}</Text>
                                                </HStack>
                                            </>
                                        ) : (
                                            <>
                                                <Text fontWeight="semibold">
                                                    {'Amount Authorized (raw, i.e. no decimals)'}
                                                </Text>
                                                <NumberInput
                                                    value={rawAuthorizedAmount.toString()}
                                                    onChange={onRawAuthorizedAmountChange}
                                                    w="100%"
                                                >
                                                    <NumberInputField placeholder="Enter raw amount to authorize" />
                                                </NumberInput>
                                            </>
                                        )}
                                    </VStack>
                                </>
                            ) : (
                                <>
                                    <VStack align="start" w="100%">
                                        <Text fontWeight="semibold">{'Cycle Repeat Frequency (seconds)'}</Text>
                                        <NumberInput
                                            value={
                                                recurringRepeatFrequency === BigInt(0)
                                                    ? ''
                                                    : recurringRepeatFrequency.toString()
                                            }
                                            onChange={onRepeatFrequencyChanged}
                                            w="100%"
                                        >
                                            <NumberInputField placeholder="Enter repeat frequency in seconds" />
                                        </NumberInput>
                                    </VStack>
                                    <VStack align="start" w="100%">
                                        <Text fontWeight="semibold">{'Number of Cycles to repeat (optional)'}</Text>
                                        <NumberInput
                                            value={numCycles === BigInt(0) ? '' : numCycles.toString()}
                                            onChange={onNumCyclesChanged}
                                            w="100%"
                                        >
                                            <NumberInputField placeholder="Enter optional number of cycles" />
                                        </NumberInput>
                                    </VStack>
                                    <VStack align="start" w="100%">
                                        <VStack w="100%" align="start">
                                            <Text fontWeight="semibold">{'Reset Amount Every Cycle'}</Text>
                                            <Text fontWeight="semibold">
                                                {'(WARNING: "false" accumulates across cycles)'}
                                            </Text>
                                        </VStack>
                                        <Switch
                                            isChecked={resetEveryCycle}
                                            onChange={(e) => setResetEveryCycle(e.target.checked)}
                                        />
                                    </VStack>
                                    <VStack align="start" w="100%">
                                        {token ? (
                                            <>
                                                <Text fontWeight="semibold">Recurring Amount Authorized</Text>
                                                <HStack w="100%">
                                                    <NumberInput
                                                        value={
                                                            authorizedAmount.eq(0) ? '' : authorizedAmount.toString()
                                                        }
                                                        onChange={onAuthorizedAmountChange}
                                                        w="100%"
                                                    >
                                                        <NumberInputField placeholder="Enter amount to authorize" />
                                                    </NumberInput>
                                                    <Text>{token.symbol}</Text>
                                                </HStack>
                                            </>
                                        ) : (
                                            <>
                                                <Text fontWeight="semibold">
                                                    {'Recurring Amount Authorized (raw, i.e. no decimals)'}
                                                </Text>
                                                <NumberInput
                                                    value={rawAuthorizedAmount.toString()}
                                                    onChange={onRawAuthorizedAmountChange}
                                                    w="100%"
                                                >
                                                    <NumberInputField placeholder="Enter raw amount to authorize" />
                                                </NumberInput>
                                            </>
                                        )}
                                    </VStack>
                                </>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            onClick={preAuthType === 'one-time' ? onCreateOneTimePreAuth : onCreateRecurringPreAuth}
                            isDisabled={
                                preAuthType === 'one-time'
                                    ? creating ||
                                      !debitAuthority ||
                                      (authorizedAmount.eq(0) && rawAuthorizedAmount === BigInt(0))
                                    : creating ||
                                      !debitAuthority ||
                                      recurringRepeatFrequency === BigInt(0) ||
                                      (authorizedAmount.eq(0) && rawAuthorizedAmount === BigInt(0))
                            }
                        >
                            Create {creating && <Spinner ml="20px" />}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default CreatePreAuthorizationModal;
