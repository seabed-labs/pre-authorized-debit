import { PropsWithChildren } from 'react';
import { HStack } from '@chakra-ui/react';
import SideNav from './SideNav';

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <main>
            <HStack minH="100vh" minW="100vw">
                <SideNav />
                {children}
            </HStack>
        </main>
    );
};

export default Layout;
