import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
} from '@chakra-ui/react';

export interface CreatePreAuthorizationModalProps {}

const CreatePreAuthorizationModal: React.FC = ({}: CreatePreAuthorizationModalProps) => {
    const { isOpen, onClose, onOpen } = useDisclosure();

    return (
        <>
            <Button onClick={onOpen}>Create Pre-Authorization</Button>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />

                <ModalContent>
                    <ModalHeader>Title</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>Body</ModalBody>
                    <ModalFooter>
                        <Button>Create</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default CreatePreAuthorizationModal;
