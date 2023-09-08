use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenAccount;

use crate::{errors::CustomProgramError, state::pre_authorization::PreAuthorization};

#[derive(Accounts)]
pub struct ClosePreAuthorization<'info> {
    // Either the token account owner signs and sets any receiver they want
    // or receiver MUST be token_account.owner
    /// CHECK: This can be any account
    #[account(
        mut,
        constraint = (
            authority.key.eq(&token_account.owner) ||
            receiver.key.eq(&token_account.owner)
        ) @ CustomProgramError::OnlyTokenAccountOwnerCanReceiveClosePreAuthFunds
    )]
    pub receiver: AccountInfo<'info>,

    #[account(
        constraint = (
            authority.key.eq(&token_account.owner) ||
            authority.key.eq(&pre_authorization.debit_authority)
        ) @ CustomProgramError::PreAuthorizationCloseUnauthorized
    )]
    pub authority: Signer<'info>,

    pub token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close = receiver,
        seeds = [
            b"pre-authorization",
            token_account.key().as_ref(),
            pre_authorization.debit_authority.as_ref(),
        ],
        bump = pre_authorization.bump,
        has_one = token_account @ CustomProgramError::PreAuthorizationTokenAccountMismatch,
    )]
    pub pre_authorization: Account<'info, PreAuthorization>,
}

pub fn handle_close_pre_authorization(ctx: Context<ClosePreAuthorization>) -> Result<()> {
    let event_data = PreAuthorizationClosedEventData {
        debit_authority: ctx.accounts.pre_authorization.debit_authority,
        closing_authority: ctx.accounts.authority.key(),
        token_account_owner: ctx.accounts.token_account.owner,
        receiver: ctx.accounts.receiver.key(),
        token_account: ctx.accounts.token_account.key(),
        pre_authorization: ctx.accounts.pre_authorization.key(),
    };

    match ctx.accounts.pre_authorization.variant {
        crate::state::pre_authorization::PreAuthorizationVariant::OneTime { .. } => {
            emit!(OneTimePreAuthorizationClosed { data: event_data })
        }
        crate::state::pre_authorization::PreAuthorizationVariant::Recurring { .. } => {
            emit!(RecurringPreAuthorizationClosed { data: event_data })
        }
    }

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PreAuthorizationClosedEventData {
    pub debit_authority: Pubkey,
    pub closing_authority: Pubkey,
    pub token_account_owner: Pubkey,
    pub receiver: Pubkey,
    pub token_account: Pubkey,
    pub pre_authorization: Pubkey,
}

#[event]
pub struct OneTimePreAuthorizationClosed {
    pub data: PreAuthorizationClosedEventData,
}

#[event]
pub struct RecurringPreAuthorizationClosed {
    pub data: PreAuthorizationClosedEventData,
}
