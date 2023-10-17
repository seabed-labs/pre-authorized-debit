import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { usePreAuthorizations } from '../../../contexts/PreAuthorizations';
import { useEffect } from 'react';

const Pads: NextPage = () => {
    const router = useRouter();
    const preAuthorizations = usePreAuthorizations();

    useEffect(() => {
        console.log('Pre Auths:', preAuthorizations);
    }, [preAuthorizations]);

    return <>Inner Pads for Token Account {router.query.id}</>;
};

export { getServerSideProps } from '../../../shared/getServerSideProps';

export default Pads;
