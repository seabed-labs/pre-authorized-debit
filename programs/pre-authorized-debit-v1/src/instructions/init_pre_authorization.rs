use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenAccount;

use crate::{
    errors::CustomProgramError,
    state::pre_authorization::{PreAuthorization, PreAuthorizationVariant},
};

#[derive(Accounts)]
#[instruction(params: InitPreAuthorizationParams)]
pub struct InitPreAuthorization<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub owner: Signer<'info>,

    #[account(
        has_one = owner @ CustomProgramError::InitPreAuthorizationUnauthorized
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        space = 8 + PreAuthorization::INIT_SPACE,
        seeds = [
            b"pre-authorization",
            token_account.key().as_ref(),
            params.debit_authority.as_ref(),
        ],
        bump,
        payer = payer,
    )]
    pub pre_authorization: Account<'info, PreAuthorization>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitPreAuthorizationParams {
    pub variant: InitPreAuthorizationVariant,
    pub debit_authority: Pubkey,
    pub activation_unix_timestamp: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum InitPreAuthorizationVariant {
    OneTime {
        amount_authorized: u64,
        expiry_unix_timestamp: u64,
    },
    Recurring {
        repeat_frequency_seconds: u64,
        recurring_amount_authorized: u64,
        // None: infinitely recurring until cancelled / closed
        // Some(n): approved for n cycles from activation
        num_cycles: Option<u64>,
        // true: amount authorized is reset to "recurring_amount_authorized" each cycle
        // false: unused amounts from prev. cycles carries forward to new cycles (even when paused, cancel/close to stop)
        reset_every_cycle: bool,
    },
}

pub fn handle_init_pre_authorization(
    ctx: Context<InitPreAuthorization>,
    params: InitPreAuthorizationParams,
) -> Result<()> {
    ctx.accounts.pre_authorization.token_account = ctx.accounts.token_account.key();
    ctx.accounts.pre_authorization.variant = match params.variant {
        InitPreAuthorizationVariant::OneTime {
            amount_authorized,
            expiry_unix_timestamp,
        } => PreAuthorizationVariant::OneTime {
            amount_authorized,
            expiry_unix_timestamp: i64::try_from(expiry_unix_timestamp).unwrap(),
            amount_debited: 0,
        },
        InitPreAuthorizationVariant::Recurring {
            repeat_frequency_seconds,
            recurring_amount_authorized,
            num_cycles,
            reset_every_cycle,
        } => PreAuthorizationVariant::Recurring {
            repeat_frequency_seconds,
            recurring_amount_authorized,
            amount_debited_last_cycle: 0,
            amount_debited_total: 0,
            last_debited_cycle: 1, // first cycle
            num_cycles,
            reset_every_cycle,
        },
    };

    ctx.accounts.pre_authorization.paused = false;
    ctx.accounts.pre_authorization.debit_authority = params.debit_authority;
    ctx.accounts.pre_authorization.activation_unix_timestamp =
        i64::try_from(params.activation_unix_timestamp).unwrap();
    ctx.accounts.pre_authorization.bump = *ctx
        .bumps
        .get("pre_authorization")
        .expect("pre_authorization PDA bump access failed");

    let event_data = PreAuthorizationCreatedEventData {
        debit_authority: params.debit_authority.key(),
        owner: ctx.accounts.owner.key(),
        payer: ctx.accounts.payer.key(),
        token_account: ctx.accounts.token_account.key(),
        pre_authorization: ctx.accounts.pre_authorization.key(),
        init_params: params,
    };

    match ctx.accounts.pre_authorization.variant {
        PreAuthorizationVariant::OneTime { .. } => {
            emit!(OneTimePreAuthorizationCreated { data: event_data })
        }
        PreAuthorizationVariant::Recurring { .. } => {
            emit!(RecurringPreAuthorizationCreated { data: event_data })
        }
    }

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PreAuthorizationCreatedEventData {
    pub debit_authority: Pubkey,
    pub owner: Pubkey,
    pub payer: Pubkey,
    pub token_account: Pubkey,
    pub pre_authorization: Pubkey,
    pub init_params: InitPreAuthorizationParams,
}

#[event]
pub struct OneTimePreAuthorizationCreated {
    pub data: PreAuthorizationCreatedEventData,
}

#[event]
pub struct RecurringPreAuthorizationCreated {
    pub data: PreAuthorizationCreatedEventData,
}
