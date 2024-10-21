use anchor_lang::prelude::*;

#[account]
pub struct TokenLottery {
    pub winner: u64,
    pub winner_chosen: bool,
    pub start_time: i64,
    pub end_time: i64,
    pub lottery_pot_amount: u64,
    pub ticket_num: u64,
    pub ticket_price: u64,
    pub authority: Pubkey,
    pub randomness_account: Pubkey,
    pub bump: u8,
}
