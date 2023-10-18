import { Token, TokenList } from '../contexts/TokenList';

export async function getServerSideProps({ req }: any) {
    const [strictJupTokenListRes, allJupTokenListRes] = await Promise.all([
        fetch('https://token.jup.ag/strict'),
        fetch('https://token.jup.ag/all'),
    ]);

    const [strictJupTokenListData, allJupTokenListData] = (await Promise.all([
        strictJupTokenListRes.json(),
        allJupTokenListRes.json(),
    ])) as [Token[], Token[]];

    const strictJupTokenListMap = strictJupTokenListData.reduce((map, token) => {
        map[token.address] = token;

        return map;
    }, {} as TokenList['strictMap']);

    const allJupTokenListMap = allJupTokenListData.reduce((map, token) => {
        map[token.address] = token;

        return map;
    }, {} as TokenList['allMap']);

    return {
        props: {
            // first time users will not have any cookies and you may not return
            // undefined here, hence ?? is necessary
            cookies: req.headers.cookie ?? '',
            strict: strictJupTokenListData,
            all: allJupTokenListData,
            strictMap: strictJupTokenListMap,
            allMap: allJupTokenListMap,
        },
    };
}
