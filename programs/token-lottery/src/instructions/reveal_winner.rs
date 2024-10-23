use crate::error::ErrorCode;
use crate::state::TokenLottery;
use anchor_lang::prelude::*;
use switchboard_on_demand::RandomnessAccountData;

#[derive(Accounts)]
pub struct RevealWinner<'info> {
    #[account(
        mut,
        seeds = [b"token_lottery"],
        bump = token_lottery.bump
    )]
    pub token_lottery: Account<'info, TokenLottery>,
    /// CHECK: Randomness account is checked by the switchboard program
    pub randomness_account: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

pub fn process_reveal_winner(ctx: Context<RevealWinner>) -> Result<()> {
    let clock = Clock::get()?;
    let token_lottery = &mut ctx.accounts.token_lottery;

    require!(
        ctx.accounts.payer.key() == token_lottery.authority,
        ErrorCode::InvalidAuthority
    );

    require!(
        ctx.accounts.randomness_account.key() == token_lottery.randomness_account,
        ErrorCode::InvalidRandomnessAccount
    );

    require!(!token_lottery.winner_chosen, ErrorCode::WinnerAlreadyChosen);

    let randomness_data =
        RandomnessAccountData::parse(ctx.accounts.randomness_account.data.borrow()).unwrap();

    let reveal_random_value = randomness_data
        .get_value(&clock)
        .map_err(|_| ErrorCode::RandomnessNotResolved)?;

    let winner = reveal_random_value[0] as u64 % token_lottery.ticket_num;

    msg!("winner is: {} !", winner);

    token_lottery.winner = winner;
    token_lottery.winner_chosen = true;

    Ok(())
}
