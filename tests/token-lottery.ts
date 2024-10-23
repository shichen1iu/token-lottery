import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as sb from "@switchboard-xyz/on-demand";
import { PublicKey } from "@solana/web3.js";
import { TokenLottery } from "../target/types/token_lottery";

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

  it("commit randomness", async () => {
    const sbQueue = new anchor.web3.PublicKey(
      "A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w"
    );
    const queueAccount = new sb.Queue(switchboardProgram, sbQueue);

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
    });

    const createRandomnessTxHash = await provider.sendAndConfirm(
      createRandomnessTx
    );
    console.log("--------------------------------");
    console.log("Create randomness transaction hash:", createRandomnessTxHash);

    // let flag = false;
    // while (!flag) {
    //   try {
    //     const confirmedRandomness =
    //       await provider.connection.getSignatureStatus(createRandomnessTxHash);
    //     const randomnessStatus = confirmedRandomness.value[0];
    //     if (
    //       randomnessStatus?.confirmations != null &&
    //       randomnessStatus.confirmationStatus === "comfirmed"
    //     ) {
    //       flag = true;
    //     }
    //   } catch (error) {
    //     console.log("error:", error);
    //   }
    // }

    const sbCommitIx = await randomness.commitIx(sbQueue);

    const commitRandomnessIx = await program.methods
      .commitRandomness()
      .accounts({
        randomnessAccount: randomness.pubkey,
      })
      .instruction();

    const blockhashWithContext = await provider.connection.getLatestBlockhash();

    const commitRandomnessTx = new anchor.web3.Transaction({
      feePayer: wallet.publicKey,
      blockhash: blockhashWithContext.blockhash,
      lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
      })
      .add(commitRandomnessIx)
      .add(sbCommitIx);

    const commitRandomnessTxHash = await provider.sendAndConfirm(
      commitRandomnessTx
    );
    console.log("--------------------------------");
    console.log("Commit randomness transaction hash:", commitRandomnessTxHash);
  });
});
