import "./setup";

import {
  AnchorProvider,
  EventParser,
  Program,
  workspace,
} from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { PreAuthorizedDebitV1 } from "../../target/types/pre_authorized_debit_v1";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  PreAuthTestVariant,
  deriveInvalidPreAuthorization,
  derivePreAuthorization,
  fundAccounts,
  waitForTxToConfirm,
} from "./utils";
import {
  createMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  mintTo,
  createAccount,
} from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { PreAuthorizationCreatedEventData } from "../../sdk/pre-authorized-debit-v1/src";
import { InitPreAuthorizationParams } from "../../sdk/pre-authorized-debit-v1/dist/anchor-client/types/InitPreAuthorizationParams";

describe("pre-authorized-debit-v1#init-pre-authorization", () => {
  const program =
    workspace.PreAuthorizedDebitV1 as Program<PreAuthorizedDebitV1>;
  const provider = program.provider as AnchorProvider;
  const eventParser = new EventParser(program.programId, program.coder);

  let payer: Keypair,
    owner: Keypair,
    mintAuthority: Keypair,
    debitAuthority: Keypair;

  beforeEach(async () => {
    mintAuthority = Keypair.generate();
    payer = Keypair.generate();
    owner = Keypair.generate();
    debitAuthority = Keypair.generate();

    await fundAccounts(
      provider,
      [
        payer.publicKey,
        owner.publicKey,
        mintAuthority.publicKey,
        debitAuthority.publicKey,
      ],
      500e6,
    );
  });

  [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].forEach((tokenProgramId) => {
    context(`with token program ${tokenProgramId.toString()}`, () => {
      const activationUnixTimestamp =
        Math.floor(new Date().getTime() / 1e3) - 60; // -60 seconds from now
      const expirationUnixTimestamp =
        activationUnixTimestamp + 10 * 24 * 60 * 60; // +10 days from activation

      let mint: PublicKey, validTokenAccount: PublicKey;

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
        validTokenAccount = await createAccount(
          provider.connection,
          payer,
          mint,
          owner.publicKey,
          Keypair.generate(),
          undefined,
          tokenProgramId,
        );
        await mintTo(
          provider.connection,
          payer,
          mint,
          validTokenAccount,
          mintAuthority,
          1e6,
          undefined,
          undefined,
          tokenProgramId,
        );
      });

      Object.values(PreAuthTestVariant).forEach((preAuthType) => {
        context(`with ${preAuthType} pre-authorization variant`, () => {
          it("should create a pre-authorization", async () => {
            const tokenAccountDataBefore = await getAccount(
              provider.connection,
              validTokenAccount,
              undefined,
              tokenProgramId,
            );
            expect(tokenAccountDataBefore.amount.toString()).to.equal(
              (1e6).toString(),
            );

            const [payerAccountInfoBefore, ownerAccountInfoBefore] =
              await provider.connection.getMultipleAccountsInfo([
                payer.publicKey,
                owner.publicKey,
              ]);
            assert(payerAccountInfoBefore && ownerAccountInfoBefore);

            const [preAuthorization, preAuthorizationBump] =
              derivePreAuthorization(
                validTokenAccount,
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

            const signature = await program.methods
              .initPreAuthorization({
                variant: preAuthVariant,
                debitAuthority: debitAuthority.publicKey,
                activationUnixTimestamp: new anchor.BN(activationUnixTimestamp),
              })
              .accounts({
                payer: payer.publicKey,
                owner: owner.publicKey,
                tokenAccount: validTokenAccount,
                preAuthorization,
                systemProgram: SystemProgram.programId,
              })
              .signers([owner, payer])
              .rpc();
            const tx = await waitForTxToConfirm(signature, provider.connection);
            assert(tx.meta?.logMessages);

            // verify events
            const eventGenerator = eventParser.parseLogs(tx.meta.logMessages);
            const events = [...eventGenerator];
            expect(events.length).to.equal(1);
            const [initPreAuthEvent] = events;
            expect(initPreAuthEvent).to.not.equal(null);
            if (preAuthType === PreAuthTestVariant.OneTime) {
              expect(initPreAuthEvent.name).to.equal(
                "OneTimePreAuthorizationCreated",
              );
            } else {
              expect(initPreAuthEvent.name).to.equal(
                "RecurringPreAuthorizationCreated",
              );
            }
            expect(Object.keys(initPreAuthEvent.data).length).to.equal(1);
            const initPreAuthEventData = initPreAuthEvent.data
              .data as PreAuthorizationCreatedEventData;
            expect(Object.keys(initPreAuthEventData).length).to.equal(6);

            expect(initPreAuthEventData.debitAuthority.toString()).to.equal(
              debitAuthority.publicKey.toString(),
            );
            expect(initPreAuthEventData.owner.toString()).to.equal(
              owner.publicKey.toString(),
            );
            expect(initPreAuthEventData.payer.toString()).to.equal(
              payer.publicKey.toString(),
            );

            expect(initPreAuthEventData.tokenAccount.toString()).to.equal(
              validTokenAccount.toString(),
            );
            expect(initPreAuthEventData.preAuthorization.toString()).to.equal(
              preAuthorization.toString(),
            );
            const eventDataInitParams =
              initPreAuthEventData.initParams as InitPreAuthorizationParams;
            expect(
              eventDataInitParams.activationUnixTimestamp.toString(),
            ).to.equal(activationUnixTimestamp.toString());
            expect(eventDataInitParams.debitAuthority.toString()).to.equal(
              debitAuthority.publicKey.toString(),
            );
            const variantData =
              preAuthType === PreAuthTestVariant.OneTime
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (eventDataInitParams.variant as any).oneTime
                : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (eventDataInitParams.variant as any).recurring;
            expect(
              preAuthType === PreAuthTestVariant.OneTime
                ? {
                    amountAuthorized: variantData.amountAuthorized.toString(),
                    expiryUnixTimestamp:
                      variantData.expiryUnixTimestamp.toString(),
                  }
                : {
                    repeatFrequencySeconds:
                      variantData.repeatFrequencySeconds.toString(),
                    recurringAmountAuthorized:
                      variantData.recurringAmountAuthorized.toString(),
                    numCycles: variantData.numCycles,
                    resetEveryCycle: variantData.resetEveryCycle,
                  },
            ).to.deep.equal(
              preAuthType === PreAuthTestVariant.OneTime
                ? {
                    amountAuthorized: (100e6).toString(),
                    expiryUnixTimestamp: expirationUnixTimestamp.toString(),
                  }
                : {
                    repeatFrequencySeconds: "30",
                    recurringAmountAuthorized: (10e6).toString(),
                    numCycles: null,
                    resetEveryCycle: false,
                  },
            );

            // verify sol balances
            const [payerAccountInfoAfter, ownerAccountInfoAfter] =
              await provider.connection.getMultipleAccountsInfo([
                payer.publicKey,
                owner.publicKey,
              ]);
            assert(payerAccountInfoAfter && ownerAccountInfoAfter);
            expect(ownerAccountInfoBefore.lamports).to.equal(
              ownerAccountInfoAfter.lamports,
            );
            // should use payers sol to create the account
            expect(payerAccountInfoAfter.lamports).to.be.lessThan(
              payerAccountInfoBefore.lamports,
            );

            // fetch pre-authorization account and check values
            const preAuthorizationAccount =
              await program.account.preAuthorization.fetch(preAuthorization);

            if (preAuthType === PreAuthTestVariant.OneTime) {
              expect({
                ...preAuthorizationAccount,
                activationUnixTimestamp:
                  preAuthorizationAccount.activationUnixTimestamp.toString(),
                variant: {
                  oneTime: {
                    ...preAuthorizationAccount.variant.oneTime,
                    amountAuthorized:
                      preAuthorizationAccount.variant.oneTime?.amountAuthorized.toString(),
                    expiryUnixTimestamp:
                      preAuthorizationAccount.variant.oneTime?.expiryUnixTimestamp.toString(),
                    amountDebited:
                      preAuthorizationAccount.variant.oneTime?.amountDebited.toString(),
                  },
                },
              }).to.deep.equal({
                bump: preAuthorizationBump,
                paused: false,
                tokenAccount: validTokenAccount,
                debitAuthority: debitAuthority.publicKey,
                activationUnixTimestamp: activationUnixTimestamp.toString(),
                variant: {
                  oneTime: {
                    amountAuthorized: (100e6).toString(),
                    expiryUnixTimestamp: expirationUnixTimestamp.toString(),
                    amountDebited: "0",
                  },
                },
              });
            } else {
              expect({
                ...preAuthorizationAccount,
                activationUnixTimestamp:
                  preAuthorizationAccount.activationUnixTimestamp.toString(),
                variant: {
                  recurring: {
                    ...preAuthorizationAccount.variant.recurring,
                    recurringAmountAuthorized:
                      preAuthorizationAccount.variant.recurring?.recurringAmountAuthorized.toString(),
                    repeatFrequencySeconds:
                      preAuthorizationAccount.variant.recurring?.repeatFrequencySeconds.toString(),
                    amountDebitedLastCycle:
                      preAuthorizationAccount.variant.recurring?.amountDebitedLastCycle.toString(),
                    amountDebitedTotal:
                      preAuthorizationAccount.variant.recurring?.amountDebitedTotal.toString(),
                    lastDebitedCycle:
                      preAuthorizationAccount.variant.recurring?.lastDebitedCycle.toString(),
                  },
                },
              }).to.deep.equal({
                bump: preAuthorizationBump,
                paused: false,
                tokenAccount: validTokenAccount,
                debitAuthority: debitAuthority.publicKey,
                activationUnixTimestamp: activationUnixTimestamp.toString(),
                variant: {
                  recurring: {
                    repeatFrequencySeconds: "30",
                    recurringAmountAuthorized: (10e6).toString(),
                    amountDebitedLastCycle: "0",
                    amountDebitedTotal: "0",
                    lastDebitedCycle: "1",
                    numCycles: null,
                    resetEveryCycle: false,
                  },
                },
              });
            }

            // verify token account balance is unchanged
            const tokenAccountDataAfter = await getAccount(
              provider.connection,
              validTokenAccount,
              undefined,
              tokenProgramId,
            );
            expect(tokenAccountDataAfter.amount.toString()).to.equal(
              (1e6).toString(),
            );
          });
        });
      });

      it("should throw an error if the owner does not sign", async () => {
        const [preAuthorization] = derivePreAuthorization(
          validTokenAccount,
          debitAuthority.publicKey,
          program.programId,
        );
        const preAuthVariant = {
          oneTime: {
            amountAuthorized: new anchor.BN(100e6),
            expiryUnixTimestamp: new anchor.BN(expirationUnixTimestamp),
          },
        };
        await expect(
          program.methods
            .initPreAuthorization({
              variant: preAuthVariant,
              debitAuthority: debitAuthority.publicKey,
              activationUnixTimestamp: new anchor.BN(activationUnixTimestamp),
            })
            .accounts({
              payer: payer.publicKey,
              owner: owner.publicKey,
              tokenAccount: validTokenAccount,
              preAuthorization,
              systemProgram: SystemProgram.programId,
            })
            .signers([payer])
            .rpc({
              skipPreflight: true,
            }),
        ).to.eventually.be.rejectedWith(/Signature verification failed/);
      });

      it("should throw an error if the owner does not own the token account", async () => {
        const [preAuthorization] = derivePreAuthorization(
          validTokenAccount,
          debitAuthority.publicKey,
          program.programId,
        );
        const preAuthVariant = {
          oneTime: {
            amountAuthorized: new anchor.BN(100e6),
            expiryUnixTimestamp: new anchor.BN(expirationUnixTimestamp),
          },
        };
        const newOwner = Keypair.generate();
        await expect(
          program.methods
            .initPreAuthorization({
              variant: preAuthVariant,
              debitAuthority: debitAuthority.publicKey,
              activationUnixTimestamp: new anchor.BN(activationUnixTimestamp),
            })
            .accounts({
              payer: payer.publicKey,
              owner: newOwner.publicKey,
              tokenAccount: validTokenAccount,
              preAuthorization,
              systemProgram: SystemProgram.programId,
            })
            .signers([newOwner, payer])
            .rpc(),
        ).to.eventually.be.rejectedWith(
          /AnchorError caused by account: token_account. Error Code: InitPreAuthorizationUnauthorized. Error Number: 6011. Error Message: Only token account owner can initialize a pre-authorization./,
        );
      });

      it("should throw an error if the derived pre authorization public key is not the canonical PDA", async () => {
        const preAuthorization = deriveInvalidPreAuthorization(
          validTokenAccount,
          debitAuthority.publicKey,
          program.programId,
        );
        const preAuthVariant = {
          oneTime: {
            amountAuthorized: new anchor.BN(100e6),
            expiryUnixTimestamp: new anchor.BN(expirationUnixTimestamp),
          },
        };
        await expect(
          program.methods
            .initPreAuthorization({
              variant: preAuthVariant,
              debitAuthority: debitAuthority.publicKey,
              activationUnixTimestamp: new anchor.BN(activationUnixTimestamp),
            })
            .accounts({
              payer: payer.publicKey,
              owner: owner.publicKey,
              tokenAccount: validTokenAccount,
              preAuthorization,
              systemProgram: SystemProgram.programId,
            })
            .signers([owner, payer])
            .rpc(),
        ).to.eventually.be.rejectedWith(
          /AnchorError caused by account: pre_authorization. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated./,
        );
      });

      it("should throw an error if the system program is not valid", async () => {
        const [preAuthorization] = derivePreAuthorization(
          validTokenAccount,
          debitAuthority.publicKey,
          program.programId,
        );
        const preAuthVariant = {
          oneTime: {
            amountAuthorized: new anchor.BN(100e6),
            expiryUnixTimestamp: new anchor.BN(expirationUnixTimestamp),
          },
        };
        await expect(
          program.methods
            .initPreAuthorization({
              variant: preAuthVariant,
              debitAuthority: debitAuthority.publicKey,
              activationUnixTimestamp: new anchor.BN(activationUnixTimestamp),
            })
            .accounts({
              payer: payer.publicKey,
              owner: owner.publicKey,
              tokenAccount: validTokenAccount,
              preAuthorization,
              systemProgram: tokenProgramId,
            })
            .signers([owner, payer])
            .rpc(),
        ).to.eventually.be.rejectedWith(
          /AnchorError caused by account: system_program. Error Code: InvalidProgramId. Error Number: 3008. Error Message: Program ID was not as expected./,
        );
      });

      it("should not store negative timestamps even if specified via client", async () => {
        const [preAuthorization] = derivePreAuthorization(
          validTokenAccount,
          debitAuthority.publicKey,
          program.programId,
        );
        const preAuthVariant = {
          oneTime: {
            amountAuthorized: new anchor.BN(100e6),
            expiryUnixTimestamp: new anchor.BN(-1),
          },
        };
        await program.methods
          .initPreAuthorization({
            variant: preAuthVariant,
            debitAuthority: debitAuthority.publicKey,
            activationUnixTimestamp: new anchor.BN(-1),
          })
          .accounts({
            payer: payer.publicKey,
            owner: owner.publicKey,
            tokenAccount: validTokenAccount,
            preAuthorization,
            systemProgram: SystemProgram.programId,
          })
          .signers([owner, payer])
          .rpc();

        const preAuthAccount = await program.account.preAuthorization.fetch(
          preAuthorization,
        );
        expect(
          preAuthAccount.variant.oneTime?.expiryUnixTimestamp.toString(),
        ).to.equal("1");
        expect(preAuthAccount.activationUnixTimestamp.toString()).to.equal("1");
      });
    });
  });
});
