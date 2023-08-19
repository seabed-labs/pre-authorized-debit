use anchor_lang::prelude::*;

declare_id!("3FWaGq3zYcqJq2t4tszrTAwVrLTc1BcAZzVGLAbK7piR");

#[program]
pub mod seabed_program_library {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
