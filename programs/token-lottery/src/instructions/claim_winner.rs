use crate::constants::NAME;
use crate::error::ErrorCode;
use crate::state::TokenLottery;
use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{Metadata, MetadataAccount},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct ClaimWinner<'info> {
    #[account(
        mut,
        seeds = [b"token_lottery"],
        bump = token_lottery.bump
    )]
    pub token_lottery: Account<'info, TokenLottery>,
    #[account(
        seeds=[token_lottery.winner.to_le_bytes().as_ref()],
        bump,
    )]
    pub ticket_mint: InterfaceAccount<'info, Mint>,
    #[account(
        seeds = [b"collection_mint"],
        bump,
    )]
    pub collection_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [b"metadata", token_metadata_program.key().as_ref(), ticket_mint.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub ticket_metadata_account: Account<'info, MetadataAccount>,
    #[account(
        associated_token::mint=ticket_mint,
        associated_token::authority=payer,
    )]
    pub ticket_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        seeds=[b"metadata", token_metadata_program.key().as_ref(), collection_mint.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub collection_metadata_account: Account<'info, MetadataAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn process_claim_winner(ctx: Context<ClaimWinner>) -> Result<()> {
    require!(
        ctx.accounts.token_lottery.winner_chosen,
        ErrorCode::WinnerNotChosen
    );

    require!(
        ctx.accounts
            .ticket_metadata_account
            .collection
            .as_ref()
            .unwrap()
            .verified,
        ErrorCode::TicketNotVerified
    );

    require!(
        ctx.accounts
            .ticket_metadata_account
            .collection
            .as_ref()
            .unwrap()
            .key
            == ctx.accounts.collection_mint.key(),
        ErrorCode::IncorrectTicket
    );

    let ticket_name = NAME.to_owned() + &ctx.accounts.token_lottery.winner.to_string();
    let metadata_name = ctx
        .accounts
        .ticket_metadata_account
        .name
        .replace("\u{0}", "");

    msg!("Ticket name: {}", ticket_name);
    msg!("Metdata name: {}", metadata_name);

    // Check if the winner has the winning ticket
    require!(metadata_name == ticket_name, ErrorCode::IncorrectTicket);
    require!(
        ctx.accounts.ticket_token_account.amount > 0,
        ErrorCode::IncorrectTicket
    );

    **ctx
        .accounts
        .token_lottery
        .to_account_info()
        .try_borrow_mut_lamports()? -= ctx.accounts.token_lottery.lottery_pot_amount;
    **ctx.accounts.payer.try_borrow_mut_lamports()? +=
        ctx.accounts.token_lottery.lottery_pot_amount;

    ctx.accounts.token_lottery.lottery_pot_amount = 0;
    Ok(())
}
