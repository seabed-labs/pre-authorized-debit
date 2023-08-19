use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct StartVirtualDebitAgainstPad<'info> {
    pub signer: Signer<'info>,
}
