use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::{
    pre_authorization::{PreAuthorization, PreAuthorizationVariant},
    smart_account::SmartAccount,
};

#[derive(Accounts)]
pub struct InitOneTimePreAuthorization<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub authority: Signer<'info>,

    // TODO: Throw custom error if authority is a mismatch
    #[account(mut, has_one = authority)]
    pub smart_account: Account<'info, SmartAccount>,

    // We could put this in the params
    // But, here it can leverage ALTs
    // and also get validated as an actual mint
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        seeds = [
            b"pre-authorization",
            smart_account.key().as_ref(),
            smart_account.pre_authorization_nonce.to_string().as_bytes(),
        ],
        bump,
        space = 8 + PreAuthorization::INIT_SPACE,
        payer = payer,
    )]
    pub pre_authorization: Account<'info, PreAuthorization>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitOneTimePreAuthorizationParams {
    pub amount_authorized: u64,
    pub pad_authority: Pubkey,
    pub activation_unix_timestamp: u64,
}

pub fn handle_init_one_time_pre_authorization(
    ctx: Context<InitOneTimePreAuthorization>,
    params: InitOneTimePreAuthorizationParams,
) -> Result<()> {
    ctx.accounts.smart_account.pre_authorization_nonce += 1;

    ctx.accounts.pre_authorization.smart_account = ctx.accounts.smart_account.key();
    ctx.accounts.pre_authorization.mint = ctx.accounts.mint.key();
    ctx.accounts.pre_authorization.pad_authority = params.pad_authority;
    ctx.accounts.pre_authorization.activation_unix_timestamp = params.activation_unix_timestamp;
    ctx.accounts.pre_authorization.amount_debited = 0;
    ctx.accounts.pre_authorization.variant = PreAuthorizationVariant::OneTime {
        amount_authorized: params.amount_authorized,
    };

    ctx.accounts.pre_authorization.bump = *ctx
        .bumps
        .get("pre_authorization")
        .expect("pre_authorization bump");

    Ok(())
}
