import {
  AnchorProvider,
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
  PreAuthTestVariant,
  derivePreAuthorization,
  fundAccounts,
  waitForTxToConfirm,
} from "./utils";
import { PausePreAuthorizationEventData } from "../../sdk/pre-authorized-debit-v1/src";

describe("pre-authorized-debit-v1#update-pause-pre-authorization", () => {
  const program =
    workspace.PreAuthorizedDebitV1 as Program<PreAuthorizedDebitV1>;
  const provider = program.provider as AnchorProvider;
  const eventParser = new EventParser(program.programId, program.coder);

  let owner: Keypair, mintAuthority: Keypair, debitAuthority: Keypair;

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
    expect(pausePreAuthEvent).to.not.equal(null);
    if (newPausedValue) {
      expect(pausePreAuthEvent.name).to.equal("PreAuthorizationPaused");
    } else {
      expect(pausePreAuthEvent.name).to.equal("PreAuthorizationUnpaused");
    }
    expect(Object.keys(pausePreAuthEvent.data).length).to.equal(1);
    const pausePreAuthEventData = pausePreAuthEvent.data
      .data as PausePreAuthorizationEventData;
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
    mintAuthority = Keypair.generate();
    owner = Keypair.generate();
    debitAuthority = Keypair.generate();
    await fundAccounts(
      provider,
      [owner.publicKey, mintAuthority.publicKey, debitAuthority.publicKey],
      500e6,
    );
  });

  [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].forEach((tokenProgramId) => {
    context(`with token program ${tokenProgramId.toString()}`, () => {
      let mint: PublicKey, tokenAccount: PublicKey;

      Object.keys(PreAuthTestVariant).forEach((preAuthType) => {
        context(`with a ${preAuthType} pre-authorization variant`, () => {
          let preAuthorization: PublicKey;

          beforeEach(async () => {
            mint = await createMint(
              provider.connection,
              mintAuthority,
              mintAuthority.publicKey,
              null,
              6,
              Keypair.generate(),
              undefined,
              tokenProgramId,
            );
            tokenAccount = await createAccount(
              provider.connection,
              mintAuthority,
              mint,
              owner.publicKey,
              Keypair.generate(),
              undefined,
              tokenProgramId,
            );
            await mintTo(
              provider.connection,
              mintAuthority,
              mint,
              tokenAccount,
              mintAuthority,
              1e6,
              undefined,
              undefined,
              tokenProgramId,
            );
            [preAuthorization] = derivePreAuthorization(
              tokenAccount,
              debitAuthority.publicKey,
              program.programId,
            );
            const preAuthVariant =
              preAuthType === PreAuthTestVariant.OneTime
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
                payer: provider.publicKey,
                owner: owner.publicKey,
                tokenAccount,
                preAuthorization,
                systemProgram: SystemProgram.programId,
              })
              .signers([owner])
              .rpc();
          });

          it("should pause and un-pause a pre authorization", async () => {
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
                    tokenAccount,
                    preAuthorization,
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
                    tokenAccount,
                    preAuthorization,
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

          it("should pause a pre authorization twice (idempotent)", async () => {
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
                    tokenAccount,
                    preAuthorization,
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
                    tokenAccount,
                    preAuthorization,
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

          it("should throw an error if an token account does not match the pre-authorization", async () => {
            const newTokenAccount = await createAccount(
              provider.connection,
              mintAuthority,
              mint,
              owner.publicKey,
              Keypair.generate(),
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
                  preAuthorization,
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
                  tokenAccount,
                  preAuthorization,
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
