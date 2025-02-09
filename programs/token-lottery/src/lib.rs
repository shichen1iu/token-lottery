use anchor_lang::prelude::*;
mod constants;
mod error;
mod instructions;
mod state;
use instructions::*;
declare_id!("ASPXV1Wuq6CJtPNWm5xpScsbj5UZXHdY2zJqfiHtfKJj");

#[program]
pub mod token_lottery {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        start_time: i64,
        end_time: i64,
        price: u64,
    ) -> Result<()> {
        process_initialize_config(ctx, start_time, end_time, price)
    }

    pub fn initialize_lottery(ctx: Context<InitializeLottery>) -> Result<()> {
        process_initialize_lottery(ctx)
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
        process_buy_ticket(ctx)
    }

    pub fn commit_randomness(ctx: Context<CommitRandomness>) -> Result<()> {
        process_commit_randomness(ctx)
    }

    pub fn reveal_winner(ctx: Context<RevealWinner>) -> Result<()> {
        process_reveal_winner(ctx)
    }

    pub fn claim_winner(ctx: Context<ClaimWinner>) -> Result<()> {
        process_claim_winner(ctx)
    }
}
