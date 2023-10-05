import { Flex, Text, useColorModeValue } from '@chakra-ui/react';
import ColorModeToggle from './ColorModeToggle';

const SideNav: React.FC = () => {
    const bgColor = useColorModeValue('gray.100', 'gray.900');

    return (
        <Flex
            direction="column"
            w="256px"
            h="100vh"
            bgColor={bgColor}
            justifyContent="flex-start"
            alignItems="start"
            p="20px"
        >
            <Flex direction="column" justifyContent="flex-start" alignItems="center" h="50%">
                <Text fontSize="xl" fontWeight="bold">
                    Pre-Authorized Debit
                </Text>
            </Flex>
            <Flex direction="column" justifyContent="flex-end" alignItems="center" h="50%">
                <ColorModeToggle />
            </Flex>
        </Flex>
    );
};

export default SideNav;
