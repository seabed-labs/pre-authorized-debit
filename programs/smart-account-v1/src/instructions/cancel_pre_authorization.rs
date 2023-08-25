use anchor_lang::prelude::*;

use crate::state::{pre_authorization::PreAuthorization, smart_account::SmartAccount};

#[derive(Accounts)]
pub struct CancelPreAuthorization<'info> {
    pub signer: Signer<'info>,

    /// CHECK: Validated as authority below
    #[account(mut)]
    pub authority: AccountInfo<'info>,

    #[account(has_one = authority)]
    pub smart_account: Account<'info, SmartAccount>,

    // TODO: Custom errors for has_one and constraint
    #[account(
        mut,
        close = authority,
        has_one = smart_account,
        constraint = signer.key.eq(&smart_account.authority) || signer.key.eq(&pre_authorization.debit_authority)
    )]
    pub pre_authorization: Account<'info, PreAuthorization>,
}

pub fn handle_cancel_pre_authorization(_ctx: Context<CancelPreAuthorization>) -> Result<()> {
    Ok(())
}
