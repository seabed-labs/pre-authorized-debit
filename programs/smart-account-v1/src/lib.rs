pub mod state;

use anchor_lang::prelude::*;

declare_id!("3FWaGq3zYcqJq2t4tszrTAwVrLTc1BcAZzVGLAbK7piR");

#[program]
pub mod smart_account_v1 {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
