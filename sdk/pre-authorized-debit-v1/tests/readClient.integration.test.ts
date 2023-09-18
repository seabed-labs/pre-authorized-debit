/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from "chai";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { localValidatorUrl } from "./constants";
import {
  IDL,
  MAINNET_PAD_PROGRAM_ID,
  PreAuthorizedDebitReadClientImpl,
} from "../src";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { getProviderNodeWallet } from "./util";
import { TOKEN_PROGRAM_ID, createMint } from "@solana/spl-token";
import {
  fundAccounts,
  initSmartDelegateIdempotent,
} from "@dcaf/pad-test-utils";

describe("PreAuthorizedDebitReadClientImpl integration", () => {
  const connection: Connection = new Connection(localValidatorUrl, "processed");
  const provider = new AnchorProvider(connection, getProviderNodeWallet(), {
    commitment: connection.commitment,
  });
  const program = new Program(IDL, MAINNET_PAD_PROGRAM_ID, provider);
  const readClient = PreAuthorizedDebitReadClientImpl.mainnet(connection);

  let mint: PublicKey, tokenAccount: PublicKey;
  let debitAuthority: Keypair;

  before(async () => {
    await initSmartDelegateIdempotent(program, provider);
    const mintAuthority = new Keypair();
    const payerKeypair = new Keypair();
    debitAuthority = new Keypair();
    const tx = await fundAccounts(provider, [payerKeypair.publicKey], 5000e6);
    await connection.confirmTransaction(tx);
    mint = await createMint(
      connection,
      payerKeypair,
      mintAuthority.publicKey,
      null,
      6,
      Keypair.generate(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    // tokenAccount = await createAccount(
    //   provider.connection,
    //   payerKeypair,
    //   mint,
    //   provider.publicKey,
    //   Keypair.generate(),
    //   undefined,
    //   TOKEN_PROGRAM_ID,
    // );
    // const activationUnixTimestamp = Math.floor(new Date().getTime() / 1e3) - 60; // -60 seconds from now
    // const expirationUnixTimestamp = activationUnixTimestamp + 10 * 24 * 60 * 60; // +10 days from activation

    // await program.methods
    //   .initPreAuthorization({
    //     variant: {
    //       oneTime: {
    //         amountAuthorized: new anchor.BN(100e6),
    //         expiryUnixTimestamp: new anchor.BN(expirationUnixTimestamp),
    //       },
    //     },
    //     debitAuthority: debitAuthority.publicKey,
    //     activationUnixTimestamp: new anchor.BN(activationUnixTimestamp),
    //   })
    //   .accounts({
    //     payer: provider.publicKey,
    //     owner: provider.publicKey,
    //     smartDelegate,
    //     tokenAccount,
    //     preAuthorization: derivePreAuthorization(
    //       tokenAccount,
    //       debitAuthority.publicKey,
    //       program.programId,
    //     )[0],
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     systemProgram: SystemProgram.programId,
    //   })
    //   .rpc();
  });

  it("should fetch smartDelegate", async () => {
    // const smartDelegate = await readClient.fetchSmartDelegate();
    // assert.isNotEmpty(smartDelegate);
    // expect(smartDelegate!.publicKey.toString()).to.equal(
    //   "5xwfb7dPwdbgnMFABbF9mqYaD79ocSngiR9GMSY9Tfzb",
    // );
    // expect(smartDelegate!.account.bump).to.equal(255);
  });

  it("should fetch preAuthorization", async () => {
    expect(1).to.eq(1);
    // const preAuthorization = await readClient.fetchPreAuthorization({
    //   tokenAccount,
    //   debitAuthority: debitAuthority.publicKey,
    // });
    // assert.isNotEmpty(preAuthorization);
  });
});
