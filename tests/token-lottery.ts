import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { TokenLottery } from "../target/types/token_lottery";

describe("token-lottery", async () => {
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.TokenLottery as Program<TokenLottery>;

  const Token_Program_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  );

  async function buyTicket() {
    const computeIx = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
      units: 300000,
    });

    const priorityIx = anchor.web3.ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1,
    });

    const buyTicketIx = await program.methods
      .buyTicket()
      .accounts({
        tokenProgram: Token_Program_ID,
      })
      .instruction();

    const blockhashWithContext = await provider.connection.getLatestBlockhash();

    const buyTicketTx = new anchor.web3.Transaction({
      feePayer: wallet.publicKey,
      blockhash: blockhashWithContext.blockhash,
      lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
    })
      .add(buyTicketIx)
      .add(computeIx)
      .add(priorityIx);

    const buyTicketTxHash = await provider.sendAndConfirm(buyTicketTx);

    console.log("Buy ticket transaction hash:", buyTicketTxHash);
  }

  it("test token lottery ", async () => {
    const initializeConfigIx = await program.methods
      .initializeConfig(
        new anchor.BN(0),
        new anchor.BN(1760025600), //结束时间:2025/10/10
        new anchor.BN(10_000)
      )
      .instruction();

    const blockhashWithContext = await provider.connection.getLatestBlockhash();

    const initializeConfigTx = new anchor.web3.Transaction({
      feePayer: wallet.publicKey,
      blockhash: blockhashWithContext.blockhash,
      lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
    }).add(initializeConfigIx);

    const initializeConfigTxHash = await provider.sendAndConfirm(
      initializeConfigTx
    );

    console.log(
      "Initialize token-lottery config transaction hash:",
      initializeConfigTxHash
    );

    const initializeLotteryIx = await program.methods
      .initializeLottery()
      .accounts({
        tokenProgram: Token_Program_ID,
      })
      .instruction();

    const initializeLotteryTx = new anchor.web3.Transaction({
      feePayer: wallet.publicKey,
      blockhash: blockhashWithContext.blockhash,
      lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
    }).add(initializeLotteryIx);

    const initializeLotteryTxHash = await provider.sendAndConfirm(
      initializeLotteryTx
    );

    console.log(
      "Initialize token-lottery transaction hash:",
      initializeLotteryTxHash
    );

    await buyTicket();
    await buyTicket();
    await buyTicket();
    await buyTicket();
  });
});
