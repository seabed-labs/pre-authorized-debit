use anchor_lang::prelude::*;

// PDA Seeds: ['smart-account-nonce', authority]
#[account]
#[derive(Default, InitSpace)]
pub struct SmartAccount {
    // The authority has access to the funds in the smart account.
    // It can also create/delete pre-authorizations.
    // size: 32
    pub authority: Pubkey,
    // This nonce is incremented each time a smart-account is for this authority.
    // It is used in the PDA seed for a SmartAccount.
    // size: 16
    pub smart_account_nonce: u128,
}
