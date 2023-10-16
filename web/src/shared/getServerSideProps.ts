export async function getServerSideProps({ req }: any) {
    const strictJupTokenListRes = await fetch('https://token.jup.ag/strict');
    const strictJupTokenListData = await strictJupTokenListRes.json();

    const allJupTokenListRes = await fetch('https://token.jup.ag/all');
    const allJupTokenListData = await allJupTokenListRes.json();

    return {
        props: {
            // first time users will not have any cookies and you may not return
            // undefined here, hence ?? is necessary
            cookies: req.headers.cookie ?? '',
            strict: strictJupTokenListData,
            all: allJupTokenListData,
        },
    };
}
