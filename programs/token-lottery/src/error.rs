use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Lottery not open")]
    LotteryNotOpen,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Randomness already revealed")]
    RandomnessAlreadyRevealed,
}
