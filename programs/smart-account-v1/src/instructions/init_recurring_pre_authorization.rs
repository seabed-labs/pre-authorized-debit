use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitRecurringPreAuthorization<'info> {
    pub signer: Signer<'info>,
}
