use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CompleteVirtualDebitAgainstPad<'info> {
    pub signer: Signer<'info>,
}
