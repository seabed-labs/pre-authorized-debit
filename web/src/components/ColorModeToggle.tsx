import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { HStack, Switch, useColorMode } from '@chakra-ui/react';

const ColorModeToggle: React.FC = () => {
    const { colorMode, setColorMode } = useColorMode();

    return (
        <HStack>
            <SunIcon />
            <Switch
                isChecked={colorMode === 'dark'}
                onChange={(e) => {
                    if (e.target.checked) {
                        setColorMode('dark');
                    } else {
                        setColorMode('light');
                    }
                }}
            />
            <MoonIcon />
        </HStack>
    );
};

export default ColorModeToggle;
