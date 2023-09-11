use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
/**
  The `smart_delegate` is a PDA account derived with the seeds:
  ['smart-delegate'].
  The `smart_delegate` should be set as the delegate of any
  `token_account` specified in a `pre_authorization`.
  The `smart_delegate` is a global account and is only initialized once.
*/
pub struct SmartDelegate {
    /**
      The `bump` is the canonical PDA bump when derived with seeds:
      ['smart-delegate'].
      This field is initialized in `init_smart_delegate`.
      This field is never updated in any instruction.
    */
    pub bump: u8,
}
