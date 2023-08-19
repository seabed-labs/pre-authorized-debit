use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CompleteVirtualDebitAsAuthority<'info> {
    pub signer: Signer<'info>,
}
