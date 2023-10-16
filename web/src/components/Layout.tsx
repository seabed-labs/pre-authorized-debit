import { PropsWithChildren } from 'react';
import { Box, CSSReset, HStack } from '@chakra-ui/react';
import SideNav from './SideNav';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <main>
            <HStack minH="100vh" minW="100vw">
                <SideNav />
                {children}
                <Box
                    position="fixed"
                    top="0px"
                    right="0px"
                    m="20px"
                    css={{ '.wallet-adapter-button:hover': { 'background-color': '#622da8' } }}
                >
                    <WalletMultiButtonDynamic />
                </Box>
            </HStack>
        </main>
    );
};

export default Layout;
