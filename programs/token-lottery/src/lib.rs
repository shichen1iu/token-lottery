use anchor_lang::prelude::*;
mod instructions;
mod state;
mod constants;
use instructions::*;
declare_id!("ASPXV1Wuq6CJtPNWm5xpScsbj5UZXHdY2zJqfiHtfKJj");

#[program]
pub mod token_lottery {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        start_time: u64,
        end_time: u64,
        price: u64,
    ) -> Result<()> {
        process_initialize_config(ctx, start_time, end_time, price)
    }

    pub fn initialize_lottery(ctx: Context<InitializeLottery>) -> Result<()> {
        process_initialize_lottery(ctx)
    }
}
