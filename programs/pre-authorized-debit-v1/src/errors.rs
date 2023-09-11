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

    #[msg("Invalid timestamp value provided")]
    InvalidTimestamp, // 6003 or 0x1773

    #[msg("Pre-Authorization paused")]
    PreAuthorizationPaused, // 6004 or 0x1774

    #[msg("Only token account owner can receive funds from closing pre-authorization account")]
    OnlyTokenAccountOwnerCanReceiveClosePreAuthFunds, // 6005 or 0x1775

    #[msg("Pre-authorization and token account mismatch")]
    PreAuthorizationTokenAccountMismatch, // 6006 or 0x1776

    #[msg("Pre-authorization can only be closed by debit_authority or token_account.owner")]
    PreAuthorizationCloseUnauthorized, // 6007 or 0x1777

    #[msg("Smart delegate can only be closed by token account owner")]
    SmartDelegateCloseUnauthorized, // 6008 or 0x1778

    #[msg("Only token account owner can pause a pre-authorization")]
    PausePreAuthorizationUnauthorized, // 6009 or 0x1779

    #[msg("Only pre_authorization.debit_authority is authorized to debit funds using pre-authorizations")]
    DebitUnauthorized, // 6010 or 0x177A

    #[msg("Only token account owner can initialize a pre-authorization")]
    InitPreAuthorizationUnauthorized, // 6011 or 0x177B

    #[msg("Only token account owner can initialize a smart delegate")]
    InitSmartDelegateUnauthorized, // 6012 or 0x177C
}
