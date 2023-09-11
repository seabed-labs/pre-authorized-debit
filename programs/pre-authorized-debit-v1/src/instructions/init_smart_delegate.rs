use crate::state::smart_delegate::SmartDelegate;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitSmartDelegate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [
            b"smart-delegate",
        ],
        bump,
        space = 8 + SmartDelegate::INIT_SPACE,
        payer = payer,
    )]
    pub smart_delegate: Account<'info, SmartDelegate>,

    pub system_program: Program<'info, System>,
}

pub fn handle_init_smart_delegate(ctx: Context<InitSmartDelegate>) -> Result<()> {
    ctx.accounts.smart_delegate.bump = *ctx
        .bumps
        .get("smart_delegate")
        .expect("smart_delegate PDA bump access failed");
    emit!(SmartDelegateInitialized {
        payer: ctx.accounts.payer.key(),
        smart_delegate: ctx.accounts.smart_delegate.key(),
    });
    Ok(())
}

#[event]
pub struct SmartDelegateInitialized {
    pub payer: Pubkey,
    pub smart_delegate: Pubkey,
}
