use anchor_lang::prelude::*;

// PDA Seeds: ['pre-authorization', token_account, debit_authority]
#[account]
#[derive(Default, InitSpace)]
/**
 The `pre_authorization` is a PDA account derived with the seeds:
 ['pre-authorization', token_account, debit_authority].
 The `pre_authorization` can be thought of as the rule for the `smart_delegate`.
 The `pre_authorization` can validate a recurring or one-time debit from the `token_account`.
 The `smart_delegate` will validate the rules of the `pre_authorization` in the `debit` instruction.
 A `pre_authorization` is associated many:1 with a `token_account`,
 however, for a given `debit_authority` and `token_account` there can only be one `pre_authorization`.
*/
pub struct PreAuthorization {
    /**
      The `bump` is the canonical PDA bump when derived with seeds:
      ['pre-authorization', token_account, debit_authority].
      This field is initialized in `init_pre_authorization`.
      This field is never updated in any instruction.
    */
    pub bump: u8,
    /**
      If `paused === true`, then the `debit_authority` cannot debit via the `token_account`.
      This field is initialized to `false` in `init_pre_authorization`.
      This field can be updated by the `token_account.owner` in `update_pause_pre_authorization`.
    */
    pub paused: bool,
    /**
      The `token_account` is the account the `debit_authority` will be able to debit from.
      This field is initialized in `init_pre_authorization`.
      This field is never updated in any instruction.
    */
    pub token_account: Pubkey,
    /**
      The `variant` contains the data specific to a one-time
      or recurring debit.
      This field is initialized in `init_pre_authorization`.
      This field is never updated in any instruction.
    */
    pub variant: PreAuthorizationVariant,
    /**
      The `debit_authority` is the key that can debit from the `token_account`.
      This field is initialized in `init_pre_authorization`.
      This field is never updated in any instruction.
    */
    pub debit_authority: Pubkey,
    /**
      The `activation_unix_timestamp` represents when the debit_authority can next debit
      from the `token_account`.
      The field is initialized to __ in `init_pre_authorization`.
      This field is updated in __ TODO(18f6ba).
    */
    pub activation_unix_timestamp: i64,
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
