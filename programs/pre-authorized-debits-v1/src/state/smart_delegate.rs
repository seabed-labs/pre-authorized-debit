use anchor_lang::prelude::*;

// PDA Seeds: ['smart-delegate', token-account]
#[account]
#[derive(Default, InitSpace)]
pub struct SmartDelegate {
    pub token_account: Pubkey,
    pub authority: Pubkey,
    pub pre_authorization_nonce: u128,
    pub bump: u8,
}
