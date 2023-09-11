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

    #[account(mut)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub destination_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        seeds = [
            b"smart-delegate"
        ],
        bump = smart_delegate.bump
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
        has_one = debit_authority @ CustomProgramError::DebitUnauthorized,
        has_one = token_account @ CustomProgramError::PreAuthorizationTokenAccountMismatch
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
                &[ctx.accounts.smart_delegate.bump],
            ]],
        ),
        params.amount,
        ctx.accounts.mint.decimals,
    )?;

    emit!(DebitEvent {
        pre_authorization: ctx.accounts.pre_authorization.key(),
        debit_authority: ctx.accounts.debit_authority.key(),
        smart_delegate: ctx.accounts.smart_delegate.key(),
        token_program: ctx.accounts.token_program.key(),
        mint: ctx.accounts.token_account.mint,
        source_token_account_owner: ctx.accounts.token_account.owner,
        destination_token_account_owner: ctx.accounts.destination_token_account.owner,
        source_token_account: ctx.accounts.token_account.key(),
        destination_token_account: ctx.accounts.destination_token_account.key(),
        debit_variant: match ctx.accounts.pre_authorization.variant {
            PreAuthorizationVariant::OneTime { .. } => DebitEventVariant::OneTime {
                debit_amount: params.amount
            },
            PreAuthorizationVariant::Recurring {
                last_debited_cycle, ..
            } => DebitEventVariant::Recurring {
                debit_amount: params.amount,
                cycle: last_debited_cycle
            },
        },
    });

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum DebitEventVariant {
    OneTime { debit_amount: u64 },
    Recurring { debit_amount: u64, cycle: u64 },
}

#[event]
pub struct DebitEvent {
    pub pre_authorization: Pubkey,
    pub debit_authority: Pubkey,
    pub smart_delegate: Pubkey,
    pub mint: Pubkey,
    pub token_program: Pubkey,
    pub source_token_account_owner: Pubkey,
    pub destination_token_account_owner: Pubkey,
    pub source_token_account: Pubkey,
    pub destination_token_account: Pubkey,
    pub debit_variant: DebitEventVariant,
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

    // could happen if validator has decreasing timestamps in between TXs due to some weirdness
    require!(
        current_cycle >= last_debited_cycle,
        CustomProgramError::LastDebitedCycleBeforeCurrentCycle
    );

    let amount_available = compute_available_amount_for_recurring_debit(
        current_cycle,
        last_debited_cycle,
        reset_every_cycle,
        recurring_amount_authorized,
        amount_debited_last_cycle,
        amount_debited_total,
    );

    require!(
        params.amount <= amount_available,
        CustomProgramError::CannotDebitMoreThanAvailable
    );

    Ok(())
}

fn compute_available_amount_for_recurring_debit(
    current_cycle: u64,
    last_debited_cycle: u64,
    reset_every_cycle: bool,
    recurring_amount_authorized: u64,
    amount_debited_last_cycle: u64,
    amount_debited_total: u64,
) -> u64 {
    assert!(current_cycle > 0);
    assert!(last_debited_cycle > 0);
    assert!(current_cycle >= last_debited_cycle);
    assert!(amount_debited_last_cycle <= amount_debited_total);
    match (reset_every_cycle, current_cycle == last_debited_cycle) {
        (false, _) => recurring_amount_authorized * current_cycle - amount_debited_total,
        (true, false) => recurring_amount_authorized,
        (true, true) => recurring_amount_authorized - amount_debited_last_cycle,
    }
}

fn compute_current_cycle(
    current_unix_timestamp: i64,
    activation_unix_timestamp: i64,
    repeat_frequency_seconds: u64,
) -> u64 {
    let seconds_since_activation =
        u64::try_from(current_unix_timestamp - activation_unix_timestamp).unwrap();
    1 + (seconds_since_activation / repeat_frequency_seconds)
}

#[cfg(test)]
mod tests {
    use super::*;
    use test_case::test_case;

    // recurring pre-auth (available amount accrues across cycles)
    #[test_case(1, 1, 0, 0, 0, 0)]
    #[test_case(1, 1, 100, 0, 0, 100)]
    #[test_case(1, 1, 100, 100, 100, 0)]
    #[test_case(5, 1, 100, 0, 0, 500)]
    #[test_case(5, 1, 100, 100, 100, 400)]
    #[test_case(5, 4, 100, 100, 100, 400)]
    #[test_case(5, 4, 100, 100, 400, 100)]
    #[test_case(5, 4, 100, 400, 400, 100)]
    #[test_case(5, 5, 100, 100, 100, 400)]
    #[test_case(5, 5, 100, 100, 400, 100)]
    #[test_case(5, 5, 100, 400, 400, 100)]
    #[test_case(5, 5, 100, 0, 500, 0)]
    #[test_case(5, 5, 100, 400, 500, 0)]
    #[test_case(5, 5, 100, 500, 500, 0)]
    #[test_case(5, 5, 100, 0, 100, 400)]
    fn compute_available_amount_for_recurring_debit_cumulative_happy_path(
        current_cycle: u64,
        last_debited_cycle: u64,
        recurring_amount_authorized: u64,
        amount_debited_last_cycle: u64,
        amount_debited_total: u64,
        expected_amount_available: u64,
    ) {
        assert_eq!(
            expected_amount_available,
            compute_available_amount_for_recurring_debit(
                current_cycle,
                last_debited_cycle,
                false,
                recurring_amount_authorized,
                amount_debited_last_cycle,
                amount_debited_total
            )
        );
    }

    // recurring pre-auth (available amount resets every cycle)
    #[test_case(1, 1, 0, 0, 0, 0)]
    #[test_case(1, 1, 100, 0, 0, 100)]
    #[test_case(1, 1, 100, 100, 100, 0)]
    #[test_case(5, 1, 100, 0, 0, 100)]
    #[test_case(5, 1, 100, 100, 100, 100)]
    #[test_case(5, 4, 100, 100, 100, 100)]
    #[test_case(5, 4, 100, 100, 400, 100)]
    #[test_case(5, 4, 100, 400, 400, 100)]
    #[test_case(5, 5, 100, 100, 100, 0)]
    #[test_case(5, 5, 100, 100, 400, 0)]
    #[test_case(5, 5, 100, 0, 500, 100)]
    #[test_case(5, 5, 100, 0, 100, 100)]
    fn compute_available_amount_for_recurring_debit_noncumulative_happy_path(
        current_cycle: u64,
        last_debited_cycle: u64,
        recurring_amount_authorized: u64,
        amount_debited_last_cycle: u64,
        amount_debited_total: u64,
        expected_amount_available: u64,
    ) {
        assert_eq!(
            expected_amount_available,
            compute_available_amount_for_recurring_debit(
                current_cycle,
                last_debited_cycle,
                true,
                recurring_amount_authorized,
                amount_debited_last_cycle,
                amount_debited_total
            )
        );
    }

    // recurring pre-auth (available amount accrues across cycles)
    // asserts
    #[test_case(0, 1, 0, 0, 0)]
    #[test_case(1, 0, 0, 0, 0)]
    #[test_case(1, 2, 0, 0, 0)]
    #[test_case(1, 1, 10, 10, 5)]
    // other cases
    #[test_case(1, 1, 100, 100, 0)]
    #[test_case(5, 1, 100, 100, 0)]
    #[test_case(5, 1, 100, 100, 600)]
    #[test_case(5, 4, 100, 100, 600)]
    #[test_case(5, 5, 100, 100, 600)]
    #[should_panic]
    fn compute_available_amount_for_recurring_debit_cumulative_panics(
        current_cycle: u64,
        last_debited_cycle: u64,
        recurring_amount_authorized: u64,
        amount_debited_last_cycle: u64,
        amount_debited_total: u64,
    ) {
        compute_available_amount_for_recurring_debit(
            current_cycle,
            last_debited_cycle,
            false,
            recurring_amount_authorized,
            amount_debited_last_cycle,
            amount_debited_total,
        );
    }

    // recurring pre-auth (available amount resets every cycle)
    // asserts
    #[test_case(0, 1, 0, 0, 0)]
    #[test_case(1, 0, 0, 0, 0)]
    #[test_case(1, 2, 0, 0, 0)]
    #[test_case(1, 1, 10, 10, 5)]
    // other cases
    #[test_case(5, 5, 100, 400, 400)]
    #[test_case(5, 5, 100, 400, 500)]
    #[test_case(5, 5, 100, 500, 500)]
    #[should_panic]
    fn compute_available_amount_for_recurring_debit_noncumulative_panics(
        current_cycle: u64,
        last_debited_cycle: u64,
        recurring_amount_authorized: u64,
        amount_debited_last_cycle: u64,
        amount_debited_total: u64,
    ) {
        compute_available_amount_for_recurring_debit(
            current_cycle,
            last_debited_cycle,
            true,
            recurring_amount_authorized,
            amount_debited_last_cycle,
            amount_debited_total,
        );
    }

    #[test_case(100, 100, 1, 1)]
    #[test_case(101, 100, 1, 2)]
    #[test_case(102, 100, 1, 3)]
    #[test_case(98, 0, 33, 3)]
    #[test_case(100, 0, 33, 4)]
    #[test_case(100, -100, 33, 7)]
    #[test_case(i64::MAX, 0, 1, u64::try_from(i64::MAX).unwrap() + 1)]
    fn compute_current_cycle_happy_path(
        current_unix_timestamp: i64,
        activation_unix_timestamp: i64,
        repeat_frequency_seconds: u64,
        expected_res: u64,
    ) {
        assert_eq!(
            expected_res,
            compute_current_cycle(
                current_unix_timestamp,
                activation_unix_timestamp,
                repeat_frequency_seconds
            )
        );
    }

    #[test_case(0, 100, 1)]
    #[test_case(-1, 100, 1)]
    #[test_case(99, 100, 1)]
    #[should_panic]
    fn compute_current_cycle_errors(
        current_unix_timestamp: i64,
        activation_unix_timestamp: i64,
        repeat_frequency_seconds: u64,
    ) {
        compute_current_cycle(
            current_unix_timestamp,
            activation_unix_timestamp,
            repeat_frequency_seconds,
        );
    }
}
