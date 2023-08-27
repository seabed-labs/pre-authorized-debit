use anchor_lang::prelude::*;

declare_id!("9H49q8dZ3E9Pb8agwsNoLyEU77G83WwEuYbPUq6ybMHK");

#[program]
pub mod smart_delegate_v1 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
