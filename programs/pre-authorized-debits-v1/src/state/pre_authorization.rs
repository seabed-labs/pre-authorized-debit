use anchor_lang::prelude::*;

// PDA Seeds: ['pre-authorization', token_account, debit_authority]
#[account]
#[derive(Default, InitSpace)]
pub struct PreAuthorization {
    pub paused: bool,
    pub token_account: Pubkey,
    pub variant: PreAuthorizationVariant,
    pub debit_authority: Pubkey,
    pub activation_unix_timestamp: i64,
    pub bump: u8,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PreAuthorizationVariant {
    OneTime {
        amount_authorized: u64,
        expiry_unix_timestamp: i64,
        amount_debited: u64,
    },
    Recurring {
        repeat_frequency_seconds: u64,
        recurring_amount_authorized: u64,
        amount_debited_last_cycle: u64,
        amount_debited_total: u64,
        last_debited_cycle: u64,
        // None: infinite recurring
        // Some(n): approved for n cycles from activation,
        num_cycles: Option<u64>,
        // true: amount authorized is reset to "recurring_amount_authorized" each cycle
        // false: unused amounts from prev. cycles carries forward to new cycles
        reset_every_cycle: bool,
    },
}

impl Default for PreAuthorizationVariant {
    fn default() -> Self {
        PreAuthorizationVariant::OneTime {
            amount_authorized: Default::default(),
            expiry_unix_timestamp: Default::default(),
            amount_debited: Default::default(),
        }
    }
}
