use anchor_lang::prelude::*;

#[error_code]
pub enum CustomProgramError {
    #[msg("Pre-Authorization not active")]
    PreAuthorizationNotActive, // 6000 or 0x1770

    #[msg("Cannot debit more than authorized")]
    CannotDebitMoreThanAvailable, // 6001 or 0x1771

    // This may happen if the unix timestamp of the validator is weird
    #[msg("Last debited cycle is after current debited cycle (invalid state)")]
    LastDebitedCycleBeforeCurrentCycle, // 6002 or 0x1772
}
