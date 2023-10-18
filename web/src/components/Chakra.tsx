// e.g. src/Chakra.js
// a) import `ChakraProvider` component as well as the storageManagers
import { ChakraProvider, cookieStorageManagerSSR, localStorageManager } from '@chakra-ui/react';
import theme from '../styles/theme';
import { PropsWithChildren } from 'react';

export function Chakra({ cookies, children }: PropsWithChildren<{ cookies: object }>) {
    // b) Pass `colorModeManager` prop
    const colorModeManager = typeof cookies === 'string' ? cookieStorageManagerSSR(cookies) : localStorageManager;

    return (
        <ChakraProvider theme={theme} colorModeManager={colorModeManager}>
            {children}
        </ChakraProvider>
    );
}
