use anchor_lang::prelude::*;

// PDA Seeds: ['smart-account', authority, nonce]
#[account]
#[derive(Default, InitSpace)]
pub struct SmartAccount {
    // The authority has access to the funds in the smart account.
    // It can also create/delete pre-authorizations.
    // size: 32
    pub authority: Pubkey,
    // This nonce is incremented each time a pre-authorization is created based on this smart account.
    // It is used in the PDA seed for a PreAuthorization account.
    // size: 16
    pub pre_authorization_nonce: u128,
}
