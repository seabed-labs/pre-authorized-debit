export function makeExplorerLink(txSig: string): string {
    const explorerTemplateUrl = process.env.NEXT_PUBLIC_SOLANA_EXPLORER_TEMPLATE_URL;
    if (!explorerTemplateUrl) throw new Error('Env var NEXT_PUBLIC_SOLANA_EXPLORER_TEMPLATE_URL not set');
    if (explorerTemplateUrl.indexOf('{signature}') === -1)
        throw new Error('Invalid NEXT_PUBLIC_SOLANA_EXPLORER_TEMPLATE_URL');
    return explorerTemplateUrl.replaceAll('{signature}', txSig);
}
