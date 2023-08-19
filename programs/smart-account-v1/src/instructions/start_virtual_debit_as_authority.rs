use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct StartVirtualDebitAsAuthority<'info> {
    pub signer: Signer<'info>,
}
