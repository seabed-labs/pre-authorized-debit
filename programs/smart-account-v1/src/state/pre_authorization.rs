use anchor_lang::prelude::*;

// PDA Seeds: ['pre-authorization', smart_account, nonce]
#[account]
#[derive(Default, InitSpace)]
pub struct PreAuthorization {
    // References the smart account from which this pre-authorization was created.
    // size: 32
    pub smart_account: Pubkey,
    // Stores the type of PAD and it's respective metadata.
    // size: unknown (todo: figure out discriminator for enums)
    pub pad: PreAuthorizedDebit,
    // size: unknown (todo: figure out discriminator for enums)
    pub status: PreAuthorizationStatus,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PreAuthorizationStatus {
    Active,
    Cancelled,
}

impl Default for PreAuthorizationStatus {
    fn default() -> Self {
        PreAuthorizationStatus::Active
    }
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PreAuthorizedDebit {
    // size: unknown (todo: figure out discriminator for enums)
    OneTime {
        // size: 32
        mint: Pubkey,
        // size: 32
        pad_authority: Pubkey,
        // size: 8
        activation_unix_timestamp: u64,
        // size: 8
        amount_authorized: u64,
        // size: 8
        amount_debited: u64, // direct or indirect
    },
    // size: unknown (todo: figure out discriminator for enums)
    Recurring {
        // size: 32
        mint: Pubkey,
        // size: 32
        pad_authority: Pubkey,
        // size: 8
        activation_unix_timestamp: u64,
        // size: 8
        repeat_frequency_seconds: u64,
        // size: 8
        recurring_amount_authorized: u64,
        // size: 8
        amount_debited: u64, // direct or indirect
    },
}

impl Default for PreAuthorizedDebit {
    fn default() -> Self {
        PreAuthorizedDebit::OneTime {
            mint: Default::default(),
            pad_authority: Default::default(),
            activation_unix_timestamp: Default::default(),
            amount_authorized: Default::default(),
            amount_debited: Default::default(),
        }
    }
}
