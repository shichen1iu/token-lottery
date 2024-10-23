use crate::error::ErrorCode;
use crate::state::TokenLottery;
use anchor_lang::prelude::*;
use switchboard_on_demand::on_demand::accounts::RandomnessAccountData;

#[derive(Accounts)]
pub struct CommitRandomness<'info> {
    #[account(
        mut,
        seeds = [b"token_lottery"], 
        bump = token_lottery.bump
    )]
    pub token_lottery: Account<'info, TokenLottery>,
    /// CHECK: checked by the switchboard program
    pub randomness_account: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_commit_randomness(ctx: Context<CommitRandomness>) -> Result<()> {
    let clock = Clock::get()?;
    let token_lottery = &mut ctx.accounts.token_lottery;
    if ctx.accounts.payer.key() != token_lottery.authority {
        return Err(ErrorCode::InvalidAuthority.into());
    }

    let randomness_data =
        RandomnessAccountData::parse(ctx.accounts.randomness_account.data.borrow()).unwrap();

    msg!(
        "Randomness revealed at slot: {}",
        randomness_data.reveal_slot
    );
    msg!("clock slot: {}", clock.slot);
    //确保在调用 process_commit_randomness 函数时，随机数的公布只能在前一个时钟槽（即最近的槽）进行
    if randomness_data.reveal_slot != clock.slot - 1 {
        return Err(ErrorCode::RandomnessAlreadyRevealed.into());
    }

    token_lottery.randomness_account = ctx.accounts.randomness_account.key();

    Ok(())
}
