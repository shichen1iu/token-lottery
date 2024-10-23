use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClaimWinner<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
}

pub fn claim_winner(ctx: Context<ClaimWinner>) -> Result<()> {
    Ok(())
}
