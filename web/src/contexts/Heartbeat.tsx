import { useInterval } from '@chakra-ui/react';
import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface HeartbeatContextValue {
    pulse: bigint;
    forceHeartbeat(): void;
}

const HEARTBEAT_FREQUENCY_MS = 20_000;

export const HeartbeatContext = createContext<HeartbeatContextValue>({
    pulse: BigInt(0),
    forceHeartbeat() {},
});

export default function HeartbeatContextProvider({ children }: PropsWithChildren): JSX.Element {
    const [pulse, setPulse] = useState<bigint>(BigInt(0));

    const forceHeartbeat = useCallback(() => {
        setPulse((p) => p + BigInt(1));
    }, []);

    useInterval(forceHeartbeat, HEARTBEAT_FREQUENCY_MS);

    const value = useMemo(() => ({ pulse, forceHeartbeat }), [pulse, forceHeartbeat]);

    return <HeartbeatContext.Provider value={value}>{children}</HeartbeatContext.Provider>;
}

export function useHeartbeat(): HeartbeatContextValue {
    return useContext(HeartbeatContext);
}
