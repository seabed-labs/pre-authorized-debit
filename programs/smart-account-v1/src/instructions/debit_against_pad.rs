use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct DebitAgainstPad<'info> {
    pub signer: Signer<'info>,
}
