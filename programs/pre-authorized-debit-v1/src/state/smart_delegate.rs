use anchor_lang::prelude::*;

// PDA Seeds: ['smart-delegate', token_account]
#[account]
#[derive(Default, InitSpace)]
/**
  The `smart_delegate` is a PDA account derived with the seeds:
  ['smart-delegate', token_account].
  The `smart_delegate` is set as the delegate of
  the `token_account` in `init_smart_delegate` with u64::max.
  A `smart_delegate` is associated 1:1 with a `token_account`.
*/
pub struct SmartDelegate {
    /**
      The `bump` is the canonical PDA bump when derived with seeds:
      ['smart-delegate', token_account].
      This field is initialized in `init_smart_delegate`.
      This field is never updated in any instruction.
    */
    pub bump: u8,
    /**
      The `token_account` is initialized in `init_smart_delegate`.
      This field is never updated in any instruction.
    */
    pub token_account: Pubkey,
}
