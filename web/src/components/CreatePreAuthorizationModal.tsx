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
} from '@chakra-ui/react';
import { useState } from 'react';
import { TokenAccount } from '../contexts/TokenAccounts';

export interface CreatePreAuthorizationModalProps {
    tokenAccount: TokenAccount;
}

const CreatePreAuthorizationModal: React.FC<CreatePreAuthorizationModalProps> = ({
    tokenAccount,
}: CreatePreAuthorizationModalProps) => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    const [preAuthType, setPreAuthType] = useState<'one-time' | 'recurring'>('one-time');

    const tokenOrMint = tokenAccount.tokenOrMint;
    const token = tokenOrMint.type === 'token' ? tokenOrMint.token : null;

    return (
        <>
            <Button onClick={onOpen}>Create Pre-Authorization</Button>

            <Modal isOpen={isOpen} onClose={onClose}>
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
                            {preAuthType === 'one-time' ? (
                                <>
                                    <VStack align="start" w="100%">
                                        <Text fontWeight="semibold">Start Date</Text>
                                        {/* TODO: Date Picker */}
                                    </VStack>
                                    <VStack align="start" w="100%">
                                        <Text fontWeight="semibold">{'End Date (optional)'}</Text>
                                        {/* TODO: Date Picker */}
                                    </VStack>
                                    <VStack align="start" w="100%">
                                        <Text fontWeight="semibold">Debit Authority</Text>
                                        <Input placeholder="Enter debit authority address" />
                                        {/* TODO: Date Picker */}
                                    </VStack>
                                    <VStack align="start" w="100%">
                                        {token ? (
                                            <>
                                                <Text fontWeight="semibold">Amount Authorized</Text>
                                                <HStack w="100%">
                                                    <NumberInput w="100%">
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
                                                <NumberInput w="100%">
                                                    <NumberInputField placeholder="Enter raw amount to authorize" />
                                                </NumberInput>
                                            </>
                                        )}
                                    </VStack>
                                </>
                            ) : null}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button>Create</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default CreatePreAuthorizationModal;
