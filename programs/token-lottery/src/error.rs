use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Lottery not open")]
    LotteryNotOpen,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Randomness already revealed")]
    RandomnessAlreadyRevealed,
    #[msg("Invalid randomness account")]
    InvalidRandomnessAccount,
    #[msg("Winner already chosen")]
    WinnerAlreadyChosen,
    #[msg("Randomness not resolved")]
    RandomnessNotResolved,
    #[msg("Winner not chosen")]
    WinnerNotChosen,
    #[msg("Ticket not verified")]
    TicketNotVerified,
    #[msg("Incorrect ticket")]
    IncorrectTicket,
}
