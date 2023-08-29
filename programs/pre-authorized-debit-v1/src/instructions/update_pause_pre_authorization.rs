use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenAccount;

use crate::state::pre_authorization::PreAuthorization;

#[derive(Accounts)]
pub struct UpdatePausePreAuthorization<'info> {
    pub owner: Signer<'info>,

    // TODO: Throw custom error on failure
    #[account(has_one = owner)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            b"pre-authorization",
            token_account.key().as_ref(),
            pre_authorization.debit_authority.as_ref(),
        ],
        bump = pre_authorization.bump,
        // TODO: Throw custom error on failure
        has_one = token_account,
    )]
    pub pre_authorization: Account<'info, PreAuthorization>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdatePausePreAuthorizationParams {
    pub pause: bool,
}

pub fn handle_update_pause_pre_authorization(
    ctx: Context<UpdatePausePreAuthorization>,
    params: UpdatePausePreAuthorizationParams,
) -> Result<()> {
    ctx.accounts.pre_authorization.paused = params.pause;

    let event_data = PausePreAuthorizationEventData {
        owner: ctx.accounts.owner.key(),
        token_account: ctx.accounts.token_account.key(),
        pre_authorization: ctx.accounts.pre_authorization.key(),
        new_paused_value: ctx.accounts.pre_authorization.paused,
    };

    if ctx.accounts.pre_authorization.paused {
        emit!(PreAuthorizationPaused { data: event_data });
    } else {
        emit!(PreAuthorizationUnpaused { data: event_data });
    }

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PausePreAuthorizationEventData {
    pub owner: Pubkey,
    pub token_account: Pubkey,
    pub pre_authorization: Pubkey,
    pub new_paused_value: bool,
}

#[event]
pub struct PreAuthorizationPaused {
    pub data: PausePreAuthorizationEventData,
}

#[event]
pub struct PreAuthorizationUnpaused {
    pub data: PausePreAuthorizationEventData,
}
