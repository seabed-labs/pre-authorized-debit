import { type ThemeConfig, extendTheme } from '@chakra-ui/react';

const config: ThemeConfig = {
    initialColorMode: 'dark',
    useSystemColorMode: false,
};

const theme = extendTheme({
    config,
    colors: {
        bg: {
            light: 'white',
            dark: 'gray.900',
        },
    },
});
export default theme;
