import { Box, Flex, HStack, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import ColorModeToggle from './ColorModeToggle';
import { IconCoins, IconCreditCard } from '@tabler/icons-react';

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
            <Flex direction="column" justifyContent="flex-start" alignItems="start" h="50%">
                <Text fontSize="xl" fontWeight="bold">
                    Pre-Authorized Debits
                </Text>
                <VStack mt="40px" spacing="20px" alignItems="start">
                    <HStack>
                        <IconCoins />
                        <Text>Token Accounts</Text>
                    </HStack>
                    <HStack>
                        <IconCreditCard />
                        <Text>All Pre-Authorizations</Text>
                    </HStack>
                </VStack>
            </Flex>
            <Flex direction="column" justifyContent="flex-end" alignItems="start" h="50%">
                <ColorModeToggle />
            </Flex>
        </Flex>
    );
};

export default SideNav;
