use crate::state::TokenLottery;
use anchor_lang::prelude::*;
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + std::mem::size_of::<TokenLottery>(),
        seeds = [b"token_lottery"],
        bump,
    )]
    pub token_lottery: Account<'info, TokenLottery>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_initialize_config(
    ctx: Context<InitializeConfig>,
    start_time: i64,
    end_time: i64,
    price: u64,
) -> Result<()> {
    ctx.accounts.token_lottery.bump = ctx.bumps.token_lottery;
    ctx.accounts.token_lottery.start_time = start_time;
    ctx.accounts.token_lottery.end_time = end_time;
    ctx.accounts.token_lottery.authority = ctx.accounts.payer.key();
    ctx.accounts.token_lottery.ticket_num = 0;
    ctx.accounts.token_lottery.randomness_account = Pubkey::default();
    ctx.accounts.token_lottery.winner_chosen = false;
    ctx.accounts.token_lottery.ticket_price = price;
    Ok(())
}
