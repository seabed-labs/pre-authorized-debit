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
    pub variant: PreAuthorizationVariant,
    // size: 32
    pub mint: Pubkey,
    // size: 32
    pub pad_authority: Pubkey,
    // size: 8
    pub activation_unix_timestamp: u64,
    // size: 8
    pub amount_debited: u64, // direct or indirect
    pub bump: u8,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PreAuthorizationVariant {
    // size: unknown (todo: figure out discriminator for enums)
    OneTime {
        // size: 8
        amount_authorized: u64,
    },
    // size: unknown (todo: figure out discriminator for enums)
    Recurring {
        // size: 8
        repeat_frequency_seconds: u64,
        // size: 8
        recurring_amount_authorized: u64,
    },
}

impl Default for PreAuthorizationVariant {
    fn default() -> Self {
        PreAuthorizationVariant::OneTime {
            amount_authorized: Default::default(),
        }
    }
}
