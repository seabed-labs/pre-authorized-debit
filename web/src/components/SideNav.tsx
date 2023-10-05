import { Flex, Text, useColorModeValue } from '@chakra-ui/react';
import ColorModeToggle from './ColorModeToggle';

const SideNav: React.FC = () => {
    return (
        <Flex
            direction="column"
            w="256px"
            h="100vh"
            bgColor="chakra-subtle-bg"
            justifyContent="flex-start"
            alignItems="start"
            p="20px"
        >
            <Flex direction="column" justifyContent="flex-start" alignItems="center" h="50%">
                <Text fontSize="xl" fontWeight="bold">
                    Pre-Authorized Debits
                </Text>
            </Flex>
            <Flex direction="column" justifyContent="flex-end" alignItems="center" h="50%">
                <ColorModeToggle />
            </Flex>
        </Flex>
    );
};

export default SideNav;
