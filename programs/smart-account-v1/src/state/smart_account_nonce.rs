use anchor_lang::prelude::*;

// PDA Seeds: ['smart-account-nonce', authority]
#[account]
#[derive(Default, InitSpace)]
pub struct SmartAccountNonce {
    // This nonce is incremented each time a smart-account is for this authority.
    // It is used in the PDA seed for a SmartAccount.
    // size: 16
    pub nonce: u128,
    pub bump: u8,
}
