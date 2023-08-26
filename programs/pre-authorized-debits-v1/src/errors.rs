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

    #[msg("Cannot change pre-authorization variant")]
    CannotChangePreAuthorizationVariant, // 6003 or 0x1773

    #[msg("Pre-Authorization paused")]
    PreAuthorizationPaused, // 6004 or 0x1774
}
