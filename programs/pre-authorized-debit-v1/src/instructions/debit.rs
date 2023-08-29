use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{
    errors::CustomProgramError,
    state::{
        pre_authorization::{PreAuthorization, PreAuthorizationVariant},
        smart_delegate::SmartDelegate,
    },
};

#[derive(Accounts)]
pub struct Debit<'info> {
    pub debit_authority: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    pub destination_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        seeds = [
            b"smart-delegate",
            token_account.key().as_ref(),
        ],
        bump = smart_delegate.bump,
        // TODO: Throw custom error on failure
        has_one = token_account
    )]
    pub smart_delegate: Account<'info, SmartDelegate>,

    #[account(
        mut,
        seeds = [
            b"pre-authorization",
            token_account.key().as_ref(),
            debit_authority.key().as_ref(),
        ],
        bump = pre_authorization.bump,
        // TODO: Throw custom error on failure
        has_one = debit_authority,
        // TODO: Throw custom error on failure
        has_one = token_account
    )]
    pub pre_authorization: Account<'info, PreAuthorization>,

    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DebitParams {
    pub amount: u64,
}

pub fn handle_debit(ctx: Context<Debit>, params: DebitParams) -> Result<()> {
    validate_debit(&ctx, &params)?;

    ctx.accounts.pre_authorization.variant = match ctx.accounts.pre_authorization.variant {
        PreAuthorizationVariant::OneTime {
            amount_authorized,
            expiry_unix_timestamp,
            amount_debited,
        } => PreAuthorizationVariant::OneTime {
            amount_authorized,
            expiry_unix_timestamp,
            amount_debited: amount_debited + params.amount,
        },
        PreAuthorizationVariant::Recurring {
            repeat_frequency_seconds,
            recurring_amount_authorized,
            amount_debited_last_cycle,
            amount_debited_total,
            last_debited_cycle,
            num_cycles,
            reset_every_cycle,
        } => {
            let current_cycle = compute_current_cycle(
                Clock::get()?.unix_timestamp,
                ctx.accounts.pre_authorization.activation_unix_timestamp,
                repeat_frequency_seconds,
            );

            let new_amount_debited_last_cycle = if current_cycle == last_debited_cycle {
                amount_debited_last_cycle + params.amount
            } else {
                params.amount
            };

            PreAuthorizationVariant::Recurring {
                repeat_frequency_seconds,
                recurring_amount_authorized,
                num_cycles,
                reset_every_cycle,
                amount_debited_last_cycle: new_amount_debited_last_cycle,
                amount_debited_total: amount_debited_total + params.amount,
                last_debited_cycle: current_cycle,
            }
        }
    };

    // NOTE: Since this reduces the delegated amount, in theory it is good to refresh the delegated amount of the smart delegate back to u64::MAX
    //       In practice, because we set it to u64::MAX, this is never necessary (unless token is weird)
    token_interface::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.token_account.to_account_info(),
                to: ctx.accounts.destination_token_account.to_account_info(),
                authority: ctx.accounts.smart_delegate.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
            &[&[
                b"smart-delegate".as_ref(),
                ctx.accounts.token_account.key().as_ref(),
                &[ctx.accounts.smart_delegate.bump],
            ]],
        ),
        params.amount,
        ctx.accounts.mint.decimals,
    )?;

    Ok(())
}

fn validate_debit(ctx: &Context<Debit>, params: &DebitParams) -> Result<()> {
    let pre_authorization = &ctx.accounts.pre_authorization;

    require!(
        !pre_authorization.paused,
        CustomProgramError::PreAuthorizationPaused
    );

    let current_unix_timestamp = Clock::get()?.unix_timestamp;

    require!(
        current_unix_timestamp >= pre_authorization.activation_unix_timestamp,
        CustomProgramError::PreAuthorizationNotActive
    );

    match pre_authorization.variant {
        PreAuthorizationVariant::OneTime { .. } => {
            validate_one_time_pre_authorization(ctx, params)?
        }
        PreAuthorizationVariant::Recurring { .. } => {
            validate_recurring_pre_authorization(ctx, params)?
        }
    }

    Ok(())
}

fn validate_one_time_pre_authorization(ctx: &Context<Debit>, params: &DebitParams) -> Result<()> {
    let pre_authorization = &ctx.accounts.pre_authorization;
    let current_unix_timestamp = Clock::get()?.unix_timestamp;

    let (amount_authorized, expiry_unix_timestamp, amount_debited) = match pre_authorization.variant
    {
        PreAuthorizationVariant::OneTime {
            amount_authorized,
            expiry_unix_timestamp,
            amount_debited,
        } => (amount_authorized, expiry_unix_timestamp, amount_debited),
        _ => panic!("Unreachable code path"),
    };

    require!(
        current_unix_timestamp < expiry_unix_timestamp,
        CustomProgramError::PreAuthorizationNotActive
    );

    let amount_available = amount_authorized - amount_debited;

    require!(
        params.amount <= amount_available,
        CustomProgramError::CannotDebitMoreThanAvailable
    );

    Ok(())
}

fn validate_recurring_pre_authorization(ctx: &Context<Debit>, params: &DebitParams) -> Result<()> {
    let pre_authorization = &ctx.accounts.pre_authorization;
    let current_unix_timestamp = Clock::get()?.unix_timestamp;

    let (
        repeat_frequency_seconds,
        recurring_amount_authorized,
        num_cycles,
        reset_every_cycle,
        last_debited_cycle,
        amount_debited_last_cycle,
        amount_debited_total,
    ) = match pre_authorization.variant {
        PreAuthorizationVariant::Recurring {
            repeat_frequency_seconds,
            recurring_amount_authorized,
            num_cycles,
            reset_every_cycle,
            last_debited_cycle,
            amount_debited_last_cycle,
            amount_debited_total,
        } => (
            repeat_frequency_seconds,
            recurring_amount_authorized,
            num_cycles,
            reset_every_cycle,
            last_debited_cycle,
            amount_debited_last_cycle,
            amount_debited_total,
        ),
        _ => panic!("Unreachable code path"),
    };

    let current_cycle = compute_current_cycle(
        current_unix_timestamp,
        pre_authorization.activation_unix_timestamp,
        repeat_frequency_seconds,
    );

    if let Some(num_cycles) = num_cycles {
        require!(
            current_cycle <= num_cycles,
            CustomProgramError::PreAuthorizationNotActive
        );
    }

    // could happen if validator has weird timestamps
    require!(
        current_cycle >= last_debited_cycle,
        CustomProgramError::LastDebitedCycleBeforeCurrentCycle
    );

    let amount_available = match (reset_every_cycle, current_cycle == last_debited_cycle) {
        (false, _) => recurring_amount_authorized * current_cycle - amount_debited_total,
        (true, false) => recurring_amount_authorized,
        (true, true) => recurring_amount_authorized - amount_debited_last_cycle,
    };

    require!(
        params.amount <= amount_available,
        CustomProgramError::CannotDebitMoreThanAvailable
    );

    Ok(())
}

fn compute_current_cycle(
    current_unix_timestamp: i64,
    activation_unix_timestamp: i64,
    repeat_frequency_seconds: u64,
) -> u64 {
    let seconds_since_activation = (current_unix_timestamp - activation_unix_timestamp) as u64;

    let current_cycle = 1 + (seconds_since_activation / repeat_frequency_seconds);

    current_cycle
}
