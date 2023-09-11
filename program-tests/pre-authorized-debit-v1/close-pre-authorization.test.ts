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
  getAccount,
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
  initSmartDelegateIdempotent,
} from "./utils";
import { PreAuthorizationClosedEventDataFields } from "@dcaf/pad";

describe("pre-authorized-debit-v1#close-pre-authorization", () => {
  const program =
    workspace.PreAuthorizedDebitV1 as Program<PreAuthorizedDebitV1>;
  const provider = program.provider as AnchorProvider;
  const eventParser = new EventParser(program.programId, program.coder);

  let owner: Keypair, mintAuthority: Keypair, debitAuthority: Keypair;
  let smartDelegatePublicKey: PublicKey;

  const activationUnixTimestamp = Math.floor(new Date().getTime() / 1e3) - 60; // -60 seconds from now
  const expirationUnixTimestamp = activationUnixTimestamp + 10 * 24 * 60 * 60; // +10 days from activation

  before(async () => {
    smartDelegatePublicKey = await initSmartDelegateIdempotent(
      program,
      provider,
    );
  });

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

  async function verifyClosePreAuthorizationEvent(
    signature: string,
    preAuthType: PreAuthTestVariant,
    expectedDebitAuthority: PublicKey,
    expectedCloseAuthority: PublicKey,
    expectedOwner: PublicKey,
    expectedReceiver: PublicKey,
    expectedTokenAccount: PublicKey,
    expectedPreAuthorization: PublicKey,
  ): Promise<void> {
    const tx = await waitForTxToConfirm(signature, provider.connection);
    assert(tx.meta?.logMessages);

    // verify events
    const eventGenerator = eventParser.parseLogs(tx.meta.logMessages);
    const events = [...eventGenerator];
    expect(events.length).to.equal(1);
    const [closePreAuthEvent] = events;
    if (preAuthType === PreAuthTestVariant.OneTime) {
      expect(closePreAuthEvent.name).to.equal("OneTimePreAuthorizationClosed");
    } else {
      expect(closePreAuthEvent.name).to.equal(
        "RecurringPreAuthorizationClosed",
      );
    }
    expect(Object.keys(closePreAuthEvent.data).length).to.equal(1);
    const closePreAuthEventData = closePreAuthEvent.data
      .data as PreAuthorizationClosedEventDataFields;
    expect(closePreAuthEventData).to.not.equal(null);
    expect(Object.keys(closePreAuthEventData).length).to.equal(6);

    expect(closePreAuthEventData.debitAuthority.toString()).to.equal(
      expectedDebitAuthority.toString(),
    );
    expect(closePreAuthEventData.closingAuthority.toString()).to.equal(
      expectedCloseAuthority.toString(),
    );
    expect(closePreAuthEventData.tokenAccountOwner.toString()).to.equal(
      expectedOwner.toString(),
    );
    expect(closePreAuthEventData.receiver.toString()).to.equal(
      expectedReceiver.toString(),
    );
    expect(closePreAuthEventData.tokenAccount.toString()).to.equal(
      expectedTokenAccount.toString(),
    );
    expect(closePreAuthEventData.preAuthorization.toString()).to.equal(
      expectedPreAuthorization.toString(),
    );
  }

  [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].forEach((tokenProgramId) => {
    context(`with token program ${tokenProgramId.toString()}`, () => {
      let mint: PublicKey, tokenAccount: PublicKey;

      Object.values(PreAuthTestVariant).forEach((preAuthType) => {
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
                smartDelegate: smartDelegatePublicKey,
                tokenAccount,
                preAuthorization,
                tokenProgram: tokenProgramId,
                systemProgram: SystemProgram.programId,
              })
              .signers([owner])
              .rpc();
          });

          ["owner", "debit authority"].forEach((closeAuthority: string) => {
            context(`as the ${closeAuthority}`, () => {
              it("should close the pre authorization", async () => {
                const closeAuthorityKeypair =
                  closeAuthority === "owner" ? owner : debitAuthority;
                const tokenAccountDataBefore = await getAccount(
                  provider.connection,
                  tokenAccount,
                  undefined,
                  tokenProgramId,
                );

                const ownerAccountInfoBefore =
                  await provider.connection.getAccountInfo(owner.publicKey);
                assert(ownerAccountInfoBefore);

                const signature = await program.methods
                  .closePreAuthorization()
                  .accounts({
                    receiver: owner.publicKey,
                    authority: closeAuthorityKeypair.publicKey,
                    tokenAccount,
                    preAuthorization,
                  })
                  .signers([closeAuthorityKeypair])
                  .rpc();

                await verifyClosePreAuthorizationEvent(
                  signature,
                  preAuthType,
                  debitAuthority.publicKey,
                  closeAuthorityKeypair.publicKey,
                  owner.publicKey,
                  owner.publicKey,
                  tokenAccount,
                  preAuthorization,
                );

                // verify sol balances
                const ownerAccountInfoAfter =
                  await provider.connection.getAccountInfo(owner.publicKey);
                assert(ownerAccountInfoAfter);
                // should refund the owner
                expect(ownerAccountInfoAfter.lamports).to.be.greaterThan(
                  ownerAccountInfoBefore.lamports,
                );

                // verify token account is unchanged
                const tokenAccountDataAfter = await getAccount(
                  provider.connection,
                  tokenAccount,
                  undefined,
                  tokenProgramId,
                );
                expect(tokenAccountDataAfter).to.deep.equal(
                  tokenAccountDataBefore,
                );
              });
            });
          });

          it("should allow using receiver !== token_account.owner when token_account.owner signs", async () => {
            const tokenAccountDataBefore = await getAccount(
              provider.connection,
              tokenAccount,
              undefined,
              tokenProgramId,
            );

            const newReceiver = Keypair.generate();
            const signature = await program.methods
              .closePreAuthorization()
              .accounts({
                receiver: newReceiver.publicKey,
                authority: owner.publicKey,
                tokenAccount,
                preAuthorization,
              })
              .signers([owner])
              .rpc();

            await verifyClosePreAuthorizationEvent(
              signature,
              preAuthType,
              debitAuthority.publicKey,
              owner.publicKey,
              owner.publicKey,
              newReceiver.publicKey,
              tokenAccount,
              preAuthorization,
            );

            // verify sol balances
            const receiverAccountInfoAfter =
              await provider.connection.getAccountInfo(newReceiver.publicKey);
            assert(receiverAccountInfoAfter);
            // should refund the receiver
            expect(receiverAccountInfoAfter.lamports).to.be.greaterThan(0);

            // verify token account balance is unchanged
            const tokenAccountDataAfter = await getAccount(
              provider.connection,
              tokenAccount,
              undefined,
              tokenProgramId,
            );
            expect(tokenAccountDataAfter).to.deep.equal(tokenAccountDataBefore);
          });

          it("should throw an error if a token account does not match the pre-authorization", async () => {
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
                .closePreAuthorization()
                .accounts({
                  receiver: owner.publicKey,
                  authority: owner.publicKey,
                  tokenAccount: newTokenAccount,
                  preAuthorization,
                })
                .signers([owner])
                .rpc(),
            ).to.eventually.be.rejectedWith(
              /AnchorError caused by account: pre_authorization. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated./,
            );
          });

          it("should throw if the authority is invalid", async () => {
            await expect(
              program.methods
                .closePreAuthorization()
                .accounts({
                  receiver: owner.publicKey,
                  authority: mintAuthority.publicKey,
                  tokenAccount,
                  preAuthorization,
                })
                .signers([mintAuthority])
                .rpc(),
            ).to.eventually.be.rejectedWith(
              /AnchorError caused by account: authority. Error Code: PreAuthorizationCloseUnauthorized. Error Number: 6007. Error Message: Pre-authorization can only be closed by debit_authority or token_account.owner./,
            );
          });

          it("should throw if the receiver is not the token account owner when pre_authorization.debit_authority signs", async () => {
            await expect(
              program.methods
                .closePreAuthorization()
                .accounts({
                  receiver: mintAuthority.publicKey,
                  authority: debitAuthority.publicKey,
                  tokenAccount,
                  preAuthorization,
                })
                .signers([debitAuthority])
                .rpc(),
            ).to.eventually.be.rejectedWith(
              /AnchorError caused by account: receiver. Error Code: OnlyTokenAccountOwnerCanReceiveClosePreAuthFunds. Error Number: 6005. Error Message: Only token account owner can receive funds from closing pre-authorization account./,
            );
          });
        });
      });
    });
  });
});
