import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as sb from "@switchboard-xyz/on-demand";
import { PublicKey } from "@solana/web3.js";
import { TokenLottery } from "../target/types/token_lottery";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("token-lottery", async () => {
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.TokenLottery as Program<TokenLottery>;

  let switchboardProgram;
  const rngKp = anchor.web3.Keypair.generate();

  const Token_Program_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  );

  const ON_DEMAND_PROGRAM_ID = new PublicKey(
    "SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv"
  );

  before("Loading switchboard program", async () => {
    const switchboardIDL = await anchor.Program.fetchIdl(ON_DEMAND_PROGRAM_ID, {
      connection: new anchor.web3.Connection(
        "https://mainnet.helius-rpc.com/?api-key=792d0c03-a2b0-469e-b4ad-1c3f2308158c"
      ),
    });
    switchboardProgram = new anchor.Program(switchboardIDL, provider);
  });

  it("init token lottery ", async () => {
    const slot = await provider.connection.getSlot();

    const initializeConfigIx = await program.methods
      .initializeConfig(
        new anchor.BN(0),
        new anchor.BN(slot + 10), //几乎是立马结束
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

    console.log("--------------------------------");
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

    console.log("--------------------------------");
    console.log(
      "Initialize token-lottery transaction hash:",
      initializeLotteryTxHash
    );
  });

  it("buy ticket", async () => {
    async function buyTicket() {
      const computeIx = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
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

      const blockhashWithContext =
        await provider.connection.getLatestBlockhash();

      const buyTicketTx = new anchor.web3.Transaction({
        feePayer: wallet.publicKey,
        blockhash: blockhashWithContext.blockhash,
        lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
      })
        .add(computeIx)
        .add(priorityIx)
        .add(buyTicketIx);

      const buyTicketTxHash = await provider.sendAndConfirm(buyTicketTx);
      console.log("--------------------------------");
      console.log("Buy ticket transaction hash:", buyTicketTxHash);
    }

    await buyTicket();
    await buyTicket();
    await buyTicket();
    await buyTicket();
  });

  it("commit randomness and reveal winner", async () => {
    const sbQueue = new anchor.web3.PublicKey(
      "A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w"
    );
    const queueAccount = new sb.Queue(switchboardProgram, sbQueue);

    const blockhashWithContext = await provider.connection.getLatestBlockhash();

    try {
      await queueAccount.loadData();
    } catch (error) {
      console.log("error:", error);
      process.exit(1);
    }

    const [randomness, createRandomnessIx] = await sb.Randomness.create(
      switchboardProgram,
      rngKp,
      sbQueue
    );

    const createRandomnessTx = await sb.asV0Tx({
      connection: provider.connection,
      ixs: [createRandomnessIx],
      payer: wallet.publicKey,
      signers: [wallet.payer, rngKp],
      computeUnitPrice: 75_000,
      computeUnitLimitMultiple: 1.3,
    });

    // const createRandomnessTx = new anchor.web3.Transaction({
    //   feePayer: wallet.publicKey,
    //   blockhash: blockhashWithContext.blockhash,
    //   lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
    // }).add(createRandomnessIx);

    const createRandomnessTxHash = await provider.sendAndConfirm(
      createRandomnessTx
    );
    console.log("--------------------------------");
    console.log("Create randomness transaction hash:", createRandomnessTxHash);

    const sbCommitIx = await randomness.commitIx(sbQueue);

    const commitRandomnessIx = await program.methods
      .commitRandomness()
      .accounts({
        randomnessAccount: randomness.pubkey,
      })
      .instruction();

    const commitTx = await sb.asV0Tx({
      connection: switchboardProgram.provider.connection,
      ixs: [sbCommitIx, commitRandomnessIx],
      payer: wallet.publicKey,
      signers: [wallet.payer],
      computeUnitPrice: 75_000,
      computeUnitLimitMultiple: 1.3,
    });

    const commitTxHash = await provider.sendAndConfirm(commitTx);

    console.log("--------------------------------");
    console.log("Commit randomness transaction hash:", commitTxHash);

    const sbRevealIx = await randomness.revealIx();
    const revealWinnerIx = await program.methods
      .revealWinner()
      .accounts({
        randomnessAccount: randomness.pubkey,
      })
      .instruction();

    // const revealTx = await sb.asV0Tx({
    //   connection: switchboardProgram.provider.connection,
    //   ixs: [sbRevealIx, revealWinnerIx],
    //   payer: wallet.publicKey,
    //   signers: [wallet.payer],
    //   computeUnitPrice: 75_000,
    //   computeUnitLimitMultiple: 1.3,
    // });

    const revealTx = new anchor.web3.Transaction({
      feePayer: wallet.publicKey,
      blockhash: blockhashWithContext.blockhash,
      lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
    })
      .add(sbRevealIx)
      .add(revealWinnerIx);

    const revealTxHash = await provider.sendAndConfirm(revealTx);

    console.log("--------------------------------");
    console.log("Reveal randomness transaction hash:", revealTxHash);
  });

  it("Is claiming a prize", async () => {
    const tokenLotteryAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("token_lottery")],
      program.programId
    )[0];
    const lotteryConfig = await program.account.tokenLottery.fetch(
      tokenLotteryAddress
    );
    console.log("Lottery winner", lotteryConfig.winner);
    console.log("Lottery config", lotteryConfig);

    const tokenAccounts =
      await provider.connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { programId: Token_Program_ID }
      );
    tokenAccounts.value.forEach(async (account) => {
      console.log("Token account mint", account.account.data.parsed.info.mint);
      console.log("Token account address", account.pubkey.toBase58());
    });

    const winningMint = anchor.web3.PublicKey.findProgramAddressSync(
      [new anchor.BN(lotteryConfig.winner).toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];
    console.log("Winning mint", winningMint.toBase58());

    const winningTokenAddress = getAssociatedTokenAddressSync(
      winningMint,
      wallet.publicKey
    );
    console.log("Winning token address", winningTokenAddress.toBase58());

    const claimIx = await program.methods
      .claimWinner()
      .accounts({
        tokenProgram: Token_Program_ID,
      })
      .instruction();

    const blockhashContext = await provider.connection.getLatestBlockhash();

    const ClaimWinnerTx = new anchor.web3.Transaction({
      blockhash: blockhashContext.blockhash,
      lastValidBlockHeight: blockhashContext.lastValidBlockHeight,
      feePayer: wallet.payer.publicKey,
    }).add(claimIx);

    const ClaimWinnerTxHash = await provider.sendAndConfirm(ClaimWinnerTx);
    console.log("--------------------------------");
    console.log("Claim transaction hash:", ClaimWinnerTxHash);
  });
});
