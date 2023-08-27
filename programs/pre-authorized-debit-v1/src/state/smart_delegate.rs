use anchor_lang::prelude::*;

// PDA Seeds: ['smart-delegate', token_account]
#[account]
#[derive(Default, InitSpace)]
pub struct SmartDelegate {
    pub token_account: Pubkey,
    pub bump: u8,
}
