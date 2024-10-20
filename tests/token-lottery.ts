import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenLottery } from "../target/types/token_lottery";

describe("token-lottery", async () => {
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.TokenLottery as Program<TokenLottery>;

  it("Initialize token lottery config", async () => {
    const initializeConfigIx = await program.methods
      .initializeConfig(
        new anchor.BN(0),
        new anchor.BN(1729415761),
        new anchor.BN(10_000)
      )
      .instruction();

    const blockhashWithContext = await provider.connection.getLatestBlockhash();

    const tx = new anchor.web3.Transaction({
      feePayer: wallet.publicKey,
      blockhash: blockhashWithContext.blockhash,
      lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
    }).add(initializeConfigIx);

    const txHash = await provider.sendAndConfirm(tx);

    console.log("Initialize token-lottery config transaction hash:", txHash);
  });
});
