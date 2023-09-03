import {
  AnchorProvider,
  BorshCoder,
  EventParser,
  Program,
  workspace,
} from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  createMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  mintTo,
  createAccount,
} from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { PreAuthorizedDebitV1 } from "../../target/types/pre_authorized_debit_v1";

import "./setup";
import {
  derivePreAuthorization,
  fundAccounts,
  waitForTxToConfirm,
} from "./utils";

describe("pre-authorized-debit-v1#update-pause-pre-authorization", () => {
  const program =
    workspace.PreAuthorizedDebitV1 as Program<PreAuthorizedDebitV1>;
  const eventParser = new EventParser(
    program.programId,
    new BorshCoder(program.idl),
  );
  const provider = program.provider as AnchorProvider;

  let owner: Keypair;
  let mintAuthority: Keypair;
  let debitAuthority: Keypair;

  const activationUnixTimestamp = Math.floor(new Date().getTime() / 1e3) - 60; // -60 seconds from now
  const expirationUnixTimestamp = activationUnixTimestamp + 10 * 24 * 60 * 60; // +10 days from activation

  async function verifyUpdatePausePreAuthorizationEvent(
    signature: string,
    newPausedValue: boolean,
    ownerPublicKey: PublicKey,
    tokenAccountPublicKey: PublicKey,
    preAuthorizationPublicKey: PublicKey,
  ): Promise<void> {
    const tx = await waitForTxToConfirm(signature, provider.connection);
    assert(tx.meta?.logMessages);
    // verify events
    const eventGenerator = eventParser.parseLogs(tx.meta.logMessages);
    const events = [...eventGenerator];
    expect(events.length).to.equal(1);
    const [pausePreAuthEvent] = events;
    expect(pausePreAuthEvent).to.not.be.null;
    if (newPausedValue) {
      expect(pausePreAuthEvent.name).to.equal("PreAuthorizationPaused");
    } else {
      expect(pausePreAuthEvent.name).to.equal("PreAuthorizationUnpaused");
    }
    expect(Object.keys(pausePreAuthEvent.data).length).to.equal(1);
    const pausePreAuthEventData = pausePreAuthEvent.data.data as any;
    expect(Object.keys(pausePreAuthEventData).length).to.equal(4);
    expect(pausePreAuthEventData.owner!.toString()).to.equal(
      ownerPublicKey.toString(),
    );
    expect(pausePreAuthEventData.tokenAccount!.toString()).to.equal(
      tokenAccountPublicKey.toString(),
    );
    expect(pausePreAuthEventData.preAuthorization!.toString()).to.equal(
      preAuthorizationPublicKey.toString(),
    );
    expect(pausePreAuthEventData.newPausedValue).to.equal(newPausedValue);
  }

  async function verifyPreAuthorizationAccount(
    preAuthorization: PublicKey,
    expectedBeforePauseValue: boolean,
    expectedAfterPauseValue: boolean,
    testCase: () => Promise<void>,
  ): Promise<void> {
    const preAuthorizationDataBefore =
      await program.account.preAuthorization.fetch(preAuthorization);
    expect(preAuthorizationDataBefore.paused).to.equal(
      expectedBeforePauseValue,
    );
    await testCase();
    const preAuthorizationAfterData =
      await program.account.preAuthorization.fetch(preAuthorization);
    expect(preAuthorizationAfterData.paused).to.equal(expectedAfterPauseValue);
    expect(preAuthorizationAfterData.debitAuthority.toString()).to.equal(
      preAuthorizationDataBefore.debitAuthority.toString(),
    );
    expect(preAuthorizationAfterData.tokenAccount.toString()).to.equal(
      preAuthorizationDataBefore.tokenAccount.toString(),
    );
    expect(
      preAuthorizationAfterData.activationUnixTimestamp.toString(),
    ).to.equal(preAuthorizationDataBefore.activationUnixTimestamp.toString());
    expect(preAuthorizationAfterData.bump.toString()).to.equal(
      preAuthorizationDataBefore.bump.toString(),
    );
    expect(JSON.stringify(preAuthorizationAfterData.variant)).to.equal(
      JSON.stringify(preAuthorizationDataBefore.variant),
    );
  }

  beforeEach(async () => {
    mintAuthority = new Keypair();
    owner = new Keypair();
    debitAuthority = new Keypair();
    await fundAccounts(
      provider,
      [owner.publicKey, mintAuthority.publicKey, debitAuthority.publicKey],
      500_000_000,
    );
  });

  [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].forEach((tokenProgramId) => {
    context(`with token program ${tokenProgramId.toString()}`, () => {
      let mint: PublicKey;
      let tokenAccount: PublicKey;

      ["one time", "recurring"].forEach((preAuthType: string) => {
        context(`with a ${preAuthType} pre authorization`, () => {
          let preAuthorization: PublicKey;

          beforeEach(async () => {
            mint = await createMint(
              provider.connection,
              mintAuthority,
              mintAuthority.publicKey,
              null,
              6,
              new Keypair(),
              undefined,
              tokenProgramId,
            );
            tokenAccount = await createAccount(
              provider.connection,
              mintAuthority,
              mint,
              owner.publicKey,
              new Keypair(),
              undefined,
              tokenProgramId,
            );
            await mintTo(
              provider.connection,
              mintAuthority,
              mint,
              tokenAccount,
              mintAuthority,
              1_000_000,
              undefined,
              undefined,
              tokenProgramId,
            );
            preAuthorization = derivePreAuthorization(
              tokenAccount,
              debitAuthority.publicKey,
              program.programId,
            );
            const preAuthVariant =
              preAuthType === "one time"
                ? {
                    oneTime: {
                      amountAuthorized: new anchor.BN(100e6),
                      expiryUnixTimestamp: new anchor.BN(
                        expirationUnixTimestamp,
                      ),
                    },
                  }
                : {
                    recurring: {
                      repeatFrequencySeconds: new anchor.BN(30),
                      recurringAmountAuthorized: new anchor.BN(10e6),
                      numCycles: null,
                      resetEveryCycle: false,
                    },
                  };

            await program.methods
              .initPreAuthorization({
                variant: preAuthVariant,
                debitAuthority: debitAuthority.publicKey,
                activationUnixTimestamp: new anchor.BN(activationUnixTimestamp),
              })
              .accounts({
                payer: mintAuthority.publicKey,
                owner: owner.publicKey,
                tokenAccount: tokenAccount,
                preAuthorization: preAuthorization,
                systemProgram: SystemProgram.programId,
              })
              .signers([owner, mintAuthority])
              .rpc();
          });

          it(`should pause and un-pause a pre authorization`, async () => {
            // pause
            await verifyPreAuthorizationAccount(
              preAuthorization,
              false,
              true,
              async () => {
                const signature = await program.methods
                  .updatePausePreAuthorization({
                    pause: true,
                  })
                  .accounts({
                    owner: owner.publicKey,
                    tokenAccount: tokenAccount,
                    preAuthorization: preAuthorization,
                  })
                  .signers([owner])
                  .rpc();
                await verifyUpdatePausePreAuthorizationEvent(
                  signature,
                  true,
                  owner.publicKey,
                  tokenAccount,
                  preAuthorization,
                );
              },
            );

            // unpause
            await verifyPreAuthorizationAccount(
              preAuthorization,
              true,
              false,
              async () => {
                const signature = await program.methods
                  .updatePausePreAuthorization({
                    pause: false,
                  })
                  .accounts({
                    owner: owner.publicKey,
                    tokenAccount: tokenAccount,
                    preAuthorization: preAuthorization,
                  })
                  .signers([owner])
                  .rpc();
                await verifyUpdatePausePreAuthorizationEvent(
                  signature,
                  false,
                  owner.publicKey,
                  tokenAccount,
                  preAuthorization,
                );
              },
            );
          });

          it(`should pause a pre authorization twice ( idempotent)`, async () => {
            // pause
            await verifyPreAuthorizationAccount(
              preAuthorization,
              false,
              true,
              async () => {
                const signature = await program.methods
                  .updatePausePreAuthorization({
                    pause: true,
                  })
                  .accounts({
                    owner: owner.publicKey,
                    tokenAccount: tokenAccount,
                    preAuthorization: preAuthorization,
                  })
                  .signers([owner])
                  .rpc();
                await verifyUpdatePausePreAuthorizationEvent(
                  signature,
                  true,
                  owner.publicKey,
                  tokenAccount,
                  preAuthorization,
                );
              },
            );

            // pause
            await verifyPreAuthorizationAccount(
              preAuthorization,
              true,
              true,
              async () => {
                const signature = await program.methods
                  .updatePausePreAuthorization({
                    pause: true,
                  })
                  .accounts({
                    owner: owner.publicKey,
                    tokenAccount: tokenAccount,
                    preAuthorization: preAuthorization,
                  })
                  .signers([owner])
                  .rpc();
                await verifyUpdatePausePreAuthorizationEvent(
                  signature,
                  true,
                  owner.publicKey,
                  tokenAccount,
                  preAuthorization,
                );
              },
            );
          });

          it("should throw an error if an token account does not match the pre authorization", async () => {
            const newTokenAccount = await createAccount(
              provider.connection,
              mintAuthority,
              mint,
              owner.publicKey,
              new Keypair(),
              undefined,
              tokenProgramId,
            );
            await expect(
              program.methods
                .updatePausePreAuthorization({
                  pause: true,
                })
                .accounts({
                  owner: owner.publicKey,
                  tokenAccount: newTokenAccount,
                  preAuthorization: preAuthorization,
                })
                .signers([owner])
                .rpc(),
            ).to.eventually.be.rejectedWith(
              /AnchorError caused by account: pre_authorization. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated./,
            );
          });

          it("should throw an error if the owner of the token account does not sign", async () => {
            await expect(
              program.methods
                .updatePausePreAuthorization({
                  pause: true,
                })
                .accounts({
                  owner: debitAuthority.publicKey,
                  tokenAccount: tokenAccount,
                  preAuthorization: preAuthorization,
                })
                .signers([debitAuthority])
                .rpc(),
            ).to.eventually.be.rejectedWith(
              /AnchorError caused by account: token_account. Error Code: PausePreAuthorizationUnauthorized. Error Number: 6013. Error Message: Only token account owner can pause a pre-authorization./,
            );
          });
        });
      });
    });
  });
});
