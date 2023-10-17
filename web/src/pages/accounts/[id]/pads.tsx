import { NextPage } from 'next';
import { useRouter } from 'next/router';

const Pads: NextPage = () => {
    const router = useRouter();

    return <>Inner Pads for Token Account {router.query.id}</>;
};

export { getServerSideProps } from '../../../shared/getServerSideProps';

export default Pads;
