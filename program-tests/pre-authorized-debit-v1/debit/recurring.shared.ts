import "../setup";
import { PreAuthorizedDebitV1 } from "../../../target/types/pre_authorized_debit_v1";
import * as anchor from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createApproveInstruction,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  mintTo,
} from "@solana/spl-token";
import {
  DebitEvent,
  U64_MAX,
  derivePreAuthorization,
  fundAccounts,
  getCurrentUnixTimestamp,
  waitForTxToConfirm,
  initSmartDelegateIdempotent,
} from "../utils";

export function testRecurringDebit(
  tokenProgramId: PublicKey,
  testSuffix: string,
) {
  describe(`pre-authorized-debit-v1#debit (recurring) ${testSuffix}`, () => {
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const program = anchor.workspace
      .PreAuthorizedDebitV1 as anchor.Program<PreAuthorizedDebitV1>;
    const eventParser = new anchor.EventParser(
      program.programId,
      program.coder,
    );

    let fundedKeypair: Keypair;
    let mintAuthorityKeypair: Keypair;
    let debitAuthorityKeypair: Keypair;
    let userKeypair: Keypair;
    let tokenAccountPubkey: PublicKey;
    let mintPubkey: PublicKey;
    let smartDelegatePubkey: PublicKey;
    let preAuthorizationPubkey: PublicKey;
    let destinationTokenAccountOwnerPubkey: PublicKey;
    let destinationTokenAccountPubkey: PublicKey;

    before(async () => {
      smartDelegatePubkey = await initSmartDelegateIdempotent(
        program,
        provider,
      );
    });

    async function setupRecurringPreAuthorization(
      activationUnixTimestamp: number,
      repeatFrequencySeconds: number,
      recurringAmountAuthorized: bigint,
      numCycles: bigint | number | null,
      resetEveryCycle: boolean,
    ): Promise<PublicKey> {
      const [preAuthorizationPubkey] = derivePreAuthorization(
        tokenAccountPubkey,
        debitAuthorityKeypair.publicKey,
        program.programId,
      );

      await program.methods
        .initPreAuthorization({
          variant: {
            recurring: {
              repeatFrequencySeconds: new anchor.BN(repeatFrequencySeconds),
              recurringAmountAuthorized: new anchor.BN(
                recurringAmountAuthorized.toString(),
              ),
              numCycles: numCycles ? new anchor.BN(numCycles.toString()) : null,
              resetEveryCycle,
            },
          },
          debitAuthority: debitAuthorityKeypair.publicKey,
          activationUnixTimestamp: new anchor.BN(activationUnixTimestamp),
        })
        .accounts({
          payer: provider.publicKey,
          owner: userKeypair.publicKey,
          tokenAccount: tokenAccountPubkey,
          preAuthorization: preAuthorizationPubkey,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      const approveTx = new Transaction().add(
        createApproveInstruction(
          tokenAccountPubkey,
          smartDelegatePubkey,
          userKeypair.publicKey,
          BigInt(U64_MAX),
          [],
          tokenProgramId,
        ),
      );
      await provider.sendAndConfirm(approveTx, [userKeypair]);
      return preAuthorizationPubkey;
    }

    beforeEach(async () => {
      fundedKeypair = Keypair.generate();
      mintAuthorityKeypair = Keypair.generate();
      debitAuthorityKeypair = Keypair.generate();
      userKeypair = Keypair.generate();
      destinationTokenAccountOwnerPubkey = Keypair.generate().publicKey;

      await fundAccounts(provider, [fundedKeypair.publicKey], 10e9);

      mintPubkey = await createMint(
        provider.connection,
        fundedKeypair,
        mintAuthorityKeypair.publicKey,
        null,
        6,
        undefined,
        undefined,
        tokenProgramId,
      );

      tokenAccountPubkey = await createAssociatedTokenAccount(
        provider.connection,
        fundedKeypair,
        mintPubkey,
        userKeypair.publicKey,
        undefined,
        tokenProgramId,
      );

      destinationTokenAccountPubkey = await createAssociatedTokenAccount(
        provider.connection,
        fundedKeypair,
        mintPubkey,
        destinationTokenAccountOwnerPubkey,
        undefined,
        tokenProgramId,
      );

      await mintTo(
        provider.connection,
        fundedKeypair,
        mintPubkey,
        tokenAccountPubkey,
        mintAuthorityKeypair,
        1000e6,
        undefined,
        undefined,
        tokenProgramId,
      );
    });

    context("non-cumulative, unlimited recurring pre-authorization", () => {
      beforeEach(async () => {
        const activationUnixTimestamp =
          Math.floor(new Date().getTime() / 1e3) - 1; // now

        preAuthorizationPubkey = await setupRecurringPreAuthorization(
          activationUnixTimestamp,
          3, // 3 second repeat frequency
          BigInt(33e6), // authorize 33 tokens each cycle
          null, // infinite recurring pre-authorization (num_cycles set to None)
          true, // non-cumulative, i.e. reset_every_cycle is set to true
        );
      });

      it("allows debit_authority to debit funds every cycle (cycled 2x)", async () => {
        const sourceTokenAccountBefore = await getAccount(
          provider.connection,
          tokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        const destinationTokenAccountBefore = await getAccount(
          provider.connection,
          destinationTokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        const preAuthorizationBefore =
          await program.account.preAuthorization.fetch(preAuthorizationPubkey);

        expect(destinationTokenAccountBefore.amount.toString()).to.equal("0");
        expect(sourceTokenAccountBefore.amount.toString()).to.equal(
          (1000e6).toString(),
        );
        expect(sourceTokenAccountBefore.delegate?.toBase58()).to.equal(
          smartDelegatePubkey.toBase58(),
        );
        expect(sourceTokenAccountBefore.delegatedAmount.toString()).to.equal(
          U64_MAX,
        );
        expect(
          preAuthorizationBefore.variant.recurring?.amountDebitedLastCycle.toString(),
        ).to.equal("0");
        expect(
          preAuthorizationBefore.variant.recurring?.amountDebitedTotal.toString(),
        ).to.equal("0");
        expect(
          preAuthorizationBefore.variant.recurring?.lastDebitedCycle.toString(),
        ).to.equal("1");

        for (let i = 1; i <= 2; i++) {
          await program.methods
            .debit({ amount: new anchor.BN(33e6) })
            .accounts({
              debitAuthority: debitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: preAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([debitAuthorityKeypair])
            .rpc();

          const destinationTokenAccountAfter = await getAccount(
            provider.connection,
            destinationTokenAccountPubkey,
            undefined,
            tokenProgramId,
          );
          const sourceTokenAccountAfter = await getAccount(
            provider.connection,
            tokenAccountPubkey,
            undefined,
            tokenProgramId,
          );

          const preAuthorizationAfter =
            await program.account.preAuthorization.fetch(
              preAuthorizationPubkey,
            );

          expect(destinationTokenAccountAfter.amount.toString()).to.equal(
            (33e6 * i).toString(),
          );
          expect(sourceTokenAccountAfter.amount.toString()).to.equal(
            (1000e6 - 33e6 * i).toString(),
          );
          expect(sourceTokenAccountAfter.delegate?.toBase58()).to.equal(
            smartDelegatePubkey.toBase58(),
          );
          expect(sourceTokenAccountAfter.delegatedAmount.toString()).to.equal(
            (BigInt(U64_MAX) - BigInt(33e6 * i)).toString(),
          );

          expect(
            preAuthorizationAfter.variant.recurring?.amountDebitedLastCycle.toString(),
          ).to.equal((33e6).toString());

          expect(
            preAuthorizationAfter.variant.recurring?.amountDebitedTotal.toString(),
          ).to.equal((33e6 * i).toString());

          expect(
            preAuthorizationAfter.variant.recurring?.lastDebitedCycle.toString(),
          ).to.equal(i.toString());

          expect({
            ...preAuthorizationBefore,
            variant: {
              recurring: {
                ...preAuthorizationBefore.variant.recurring,
                amountDebitedLastCycle: null,
                amountDebitedTotal: null,
                lastDebitedCycle: null,
              },
            },
          }).to.deep.equal({
            ...preAuthorizationAfter,
            variant: {
              recurring: {
                ...preAuthorizationAfter.variant.recurring,
                amountDebitedLastCycle: null,
                amountDebitedTotal: null,
                lastDebitedCycle: null,
              },
            },
          });

          await delay(3);
        }
      });

      it("allows partial debits within a cycle", async () => {
        const sourceTokenAccountBefore = await getAccount(
          provider.connection,
          tokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        const destinationTokenAccountBefore = await getAccount(
          provider.connection,
          destinationTokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        const preAuthorizationBefore =
          await program.account.preAuthorization.fetch(preAuthorizationPubkey);

        expect(destinationTokenAccountBefore.amount.toString()).to.equal("0");
        expect(sourceTokenAccountBefore.amount.toString()).to.equal(
          (1000e6).toString(),
        );
        expect(sourceTokenAccountBefore.delegate?.toBase58()).to.equal(
          smartDelegatePubkey.toBase58(),
        );
        expect(sourceTokenAccountBefore.delegatedAmount.toString()).to.equal(
          U64_MAX,
        );
        expect(
          preAuthorizationBefore.variant.recurring?.amountDebitedLastCycle.toString(),
        ).to.equal("0");
        expect(
          preAuthorizationBefore.variant.recurring?.amountDebitedTotal.toString(),
        ).to.equal("0");
        expect(
          preAuthorizationBefore.variant.recurring?.lastDebitedCycle.toString(),
        ).to.equal("1");

        for (let i = 1; i <= 2; i++) {
          await program.methods
            .debit({ amount: new anchor.BN(10e6) })
            .accounts({
              debitAuthority: debitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: preAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([debitAuthorityKeypair])
            .rpc();

          const destinationTokenAccountAfter = await getAccount(
            provider.connection,
            destinationTokenAccountPubkey,
            undefined,
            tokenProgramId,
          );
          const sourceTokenAccountAfter = await getAccount(
            provider.connection,
            tokenAccountPubkey,
            undefined,
            tokenProgramId,
          );

          const preAuthorizationAfter =
            await program.account.preAuthorization.fetch(
              preAuthorizationPubkey,
            );

          expect(destinationTokenAccountAfter.amount.toString()).to.equal(
            (10e6 * i).toString(),
          );
          expect(sourceTokenAccountAfter.amount.toString()).to.equal(
            (1000e6 - 10e6 * i).toString(),
          );
          expect(sourceTokenAccountAfter.delegate?.toBase58()).to.equal(
            smartDelegatePubkey.toBase58(),
          );
          expect(sourceTokenAccountAfter.delegatedAmount.toString()).to.equal(
            (BigInt(U64_MAX) - BigInt(10e6 * i)).toString(),
          );

          expect(
            preAuthorizationAfter.variant.recurring?.amountDebitedLastCycle.toString(),
          ).to.equal((10e6 * i).toString());

          expect(
            preAuthorizationAfter.variant.recurring?.amountDebitedTotal.toString(),
          ).to.equal((10e6 * i).toString());

          expect(
            preAuthorizationAfter.variant.recurring?.lastDebitedCycle.toString(),
          ).to.equal("1");

          expect({
            ...preAuthorizationBefore,
            variant: {
              recurring: {
                ...preAuthorizationBefore.variant.recurring,
                amountDebitedLastCycle: null,
                amountDebitedTotal: null,
                lastDebitedCycle: null,
              },
            },
          }).to.deep.equal({
            ...preAuthorizationAfter,
            variant: {
              recurring: {
                ...preAuthorizationAfter.variant.recurring,
                amountDebitedLastCycle: null,
                amountDebitedTotal: null,
                lastDebitedCycle: null,
              },
            },
          });
        }
      });

      it("prevents debiting more than the amount authorized for the cycle", async () => {
        const preAuthorization = await program.account.preAuthorization.fetch(
          preAuthorizationPubkey,
        );

        expect(
          preAuthorization.variant.recurring?.amountDebitedLastCycle.toString(),
        ).to.equal("0");
        expect(
          preAuthorization.variant.recurring?.amountDebitedTotal.toString(),
        ).to.equal("0");
        expect(
          preAuthorization.variant.recurring?.lastDebitedCycle.toString(),
        ).to.equal("1");
        expect(
          preAuthorization.variant.recurring?.recurringAmountAuthorized.toString(),
        ).to.equal((33e6).toString());

        await expect(
          program.methods
            .debit({ amount: new anchor.BN(50e6) })
            .accounts({
              debitAuthority: debitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: preAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([debitAuthorityKeypair])
            .rpc(),
        ).to.be.eventually.rejectedWith(
          /Error Code: CannotDebitMoreThanAvailable. Error Number: 6001./,
        );
      });

      it("prevents debiting more than the remaining amount available for the cycle", async () => {
        const preAuthorization = await program.account.preAuthorization.fetch(
          preAuthorizationPubkey,
        );

        expect(
          preAuthorization.variant.recurring?.amountDebitedLastCycle.toString(),
        ).to.equal("0");
        expect(
          preAuthorization.variant.recurring?.amountDebitedTotal.toString(),
        ).to.equal("0");
        expect(
          preAuthorization.variant.recurring?.lastDebitedCycle.toString(),
        ).to.equal("1");
        expect(
          preAuthorization.variant.recurring?.recurringAmountAuthorized.toString(),
        ).to.equal((33e6).toString());

        await program.methods
          .debit({ amount: new anchor.BN(30e6) })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc();

        await expect(
          program.methods
            .debit({ amount: new anchor.BN(4e6) })
            .accounts({
              debitAuthority: debitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: preAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([debitAuthorityKeypair])
            .rpc(),
        ).to.be.eventually.rejectedWith(
          /Error Code: CannotDebitMoreThanAvailable. Error Number: 6001./,
        );

        await program.methods
          .debit({ amount: new anchor.BN(3e6) })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc();
      });

      it("does not carry-forward un-debited amount from previous cycle", async () => {
        await program.methods
          .debit({ amount: new anchor.BN(23e6) })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc();

        const preAuthorizationAfterFirstDebit =
          await program.account.preAuthorization.fetch(preAuthorizationPubkey);
        expect(
          preAuthorizationAfterFirstDebit.variant.recurring?.lastDebitedCycle.toString(),
        ).to.equal("1");

        await delay(3);

        await expect(
          program.methods
            .debit({ amount: new anchor.BN(34e6) })
            .accounts({
              debitAuthority: debitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: preAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([debitAuthorityKeypair])
            .rpc(),
        ).to.be.eventually.rejectedWith(
          /Error Code: CannotDebitMoreThanAvailable. Error Number: 6001./,
        );

        await program.methods
          .debit({ amount: new anchor.BN(33e6) })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc();

        const preAuthorizationAfterSecondDebit =
          await program.account.preAuthorization.fetch(preAuthorizationPubkey);
        expect(
          preAuthorizationAfterSecondDebit.variant.recurring?.lastDebitedCycle.toString(),
        ).to.equal("2");
      });
    });

    context(
      "non-cumulative, limited (to 2 cycles) recurring pre-authorization",
      () => {
        beforeEach(async () => {
          const activationUnixTimestamp =
            Math.floor(new Date().getTime() / 1e3) - 1; // now

          preAuthorizationPubkey = await setupRecurringPreAuthorization(
            activationUnixTimestamp,
            3, // 3 second repeat frequency
            BigInt(33e6), // authorize 33 tokens each cycle
            2, // limited to 2 cycles
            true, // non-cumulative, i.e. reset_every_cycle is set to true
          );
        });

        it("prevents a 3rd cycle debit", async () => {
          for (let i = 1; i <= 2; i++) {
            await program.methods
              .debit({ amount: new anchor.BN(33e6) })
              .accounts({
                debitAuthority: debitAuthorityKeypair.publicKey,
                mint: mintPubkey,
                tokenAccount: tokenAccountPubkey,
                destinationTokenAccount: destinationTokenAccountPubkey,
                smartDelegate: smartDelegatePubkey,
                preAuthorization: preAuthorizationPubkey,
                tokenProgram: tokenProgramId,
              })
              .signers([debitAuthorityKeypair])
              .rpc();

            await delay(3);
          }

          const destinationTokenAccount = await getAccount(
            provider.connection,
            destinationTokenAccountPubkey,
            undefined,
            tokenProgramId,
          );
          expect(destinationTokenAccount.amount.toString()).to.equal(
            (66e6).toString(),
          );

          const preAuthorization = await program.account.preAuthorization.fetch(
            preAuthorizationPubkey,
          );
          expect(
            preAuthorization.variant.recurring?.lastDebitedCycle.toString(),
          ).to.equal("2");

          await expect(
            program.methods
              .debit({ amount: new anchor.BN(33e6) })
              .accounts({
                debitAuthority: debitAuthorityKeypair.publicKey,
                mint: mintPubkey,
                tokenAccount: tokenAccountPubkey,
                destinationTokenAccount: destinationTokenAccountPubkey,
                smartDelegate: smartDelegatePubkey,
                preAuthorization: preAuthorizationPubkey,
                tokenProgram: tokenProgramId,
              })
              .signers([debitAuthorityKeypair])
              .rpc(),
          ).to.be.eventually.rejectedWith(
            /Error Code: PreAuthorizationNotActive. Error Number: 6000/,
          );
        });
      },
    );

    context("cumulative, unlimited recurring pre-authorization", () => {
      beforeEach(async () => {
        const activationUnixTimestamp =
          Math.floor(new Date().getTime() / 1e3) - 1; // now

        preAuthorizationPubkey = await setupRecurringPreAuthorization(
          activationUnixTimestamp,
          3, // 3 second repeat frequency
          BigInt(33e6), // authorize 33 tokens each cycle
          null, // infinite recurring pre-authorization (num_cycles set to None)
          false, // cumulative, i.e. reset_every_cycle is set to false
        );
      });

      it("allows debiting accumulated available amount", async () => {
        const sourceTokenAccountBefore = await getAccount(
          provider.connection,
          tokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        const destinationTokenAccountBefore = await getAccount(
          provider.connection,
          destinationTokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        const preAuthorizationBefore =
          await program.account.preAuthorization.fetch(preAuthorizationPubkey);

        expect(destinationTokenAccountBefore.amount.toString()).to.equal("0");
        expect(sourceTokenAccountBefore.amount.toString()).to.equal(
          (1000e6).toString(),
        );
        expect(sourceTokenAccountBefore.delegate?.toBase58()).to.equal(
          smartDelegatePubkey.toBase58(),
        );
        expect(sourceTokenAccountBefore.delegatedAmount.toString()).to.equal(
          U64_MAX,
        );
        expect(
          preAuthorizationBefore.variant.recurring?.amountDebitedLastCycle.toString(),
        ).to.equal("0");
        expect(
          preAuthorizationBefore.variant.recurring?.amountDebitedTotal.toString(),
        ).to.equal("0");
        expect(
          preAuthorizationBefore.variant.recurring?.lastDebitedCycle.toString(),
        ).to.equal("1");

        await delay(3);

        await program.methods
          .debit({ amount: new anchor.BN(66e6) })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc();

        const destinationTokenAccountAfter = await getAccount(
          provider.connection,
          destinationTokenAccountPubkey,
          undefined,
          tokenProgramId,
        );
        const sourceTokenAccountAfter = await getAccount(
          provider.connection,
          tokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        const preAuthorizationAfter =
          await program.account.preAuthorization.fetch(preAuthorizationPubkey);

        expect(destinationTokenAccountAfter.amount.toString()).to.equal(
          (66e6).toString(),
        );
        expect(sourceTokenAccountAfter.amount.toString()).to.equal(
          (1000e6 - 66e6).toString(),
        );
        expect(sourceTokenAccountAfter.delegate?.toBase58()).to.equal(
          smartDelegatePubkey.toBase58(),
        );
        expect(sourceTokenAccountAfter.delegatedAmount.toString()).to.equal(
          (BigInt(U64_MAX) - BigInt(66e6)).toString(),
        );

        expect(
          preAuthorizationAfter.variant.recurring?.amountDebitedLastCycle.toString(),
        ).to.equal((66e6).toString());

        expect(
          preAuthorizationAfter.variant.recurring?.amountDebitedTotal.toString(),
        ).to.equal((66e6).toString());

        expect(
          preAuthorizationAfter.variant.recurring?.lastDebitedCycle.toString(),
        ).to.equal("2");

        expect({
          ...preAuthorizationBefore,
          variant: {
            recurring: {
              ...preAuthorizationBefore.variant.recurring,
              amountDebitedLastCycle: null,
              amountDebitedTotal: null,
              lastDebitedCycle: null,
            },
          },
        }).to.deep.equal({
          ...preAuthorizationAfter,
          variant: {
            recurring: {
              ...preAuthorizationAfter.variant.recurring,
              amountDebitedLastCycle: null,
              amountDebitedTotal: null,
              lastDebitedCycle: null,
            },
          },
        });
      });
    });

    context(
      "cumulative, limited (to 2 cycles) recurring pre-authorization",
      () => {
        beforeEach(async () => {
          const activationUnixTimestamp =
            Math.floor(new Date().getTime() / 1e3) - 1; // now

          preAuthorizationPubkey = await setupRecurringPreAuthorization(
            activationUnixTimestamp,
            3, // 3 second repeat frequency
            BigInt(33e6), // authorize 33 tokens each cycle
            2, // finite to 2 cycles
            false, // cumulative, i.e. reset_every_cycle is set to false
          );
        });

        it("prevents a 3rd cycle debit", async () => {
          await delay(4);

          await program.methods
            .debit({ amount: new anchor.BN(66e6) })
            .accounts({
              debitAuthority: debitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: preAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([debitAuthorityKeypair])
            .rpc();

          await delay(4);

          const destinationTokenAccount = await getAccount(
            provider.connection,
            destinationTokenAccountPubkey,
            undefined,
            tokenProgramId,
          );
          expect(destinationTokenAccount.amount.toString()).to.equal(
            (66e6).toString(),
          );

          const preAuthorization = await program.account.preAuthorization.fetch(
            preAuthorizationPubkey,
          );
          expect(
            preAuthorization.variant.recurring?.lastDebitedCycle.toString(),
          ).to.equal("2");

          await expect(
            program.methods
              .debit({ amount: new anchor.BN(33e6) })
              .accounts({
                debitAuthority: debitAuthorityKeypair.publicKey,
                mint: mintPubkey,
                tokenAccount: tokenAccountPubkey,
                destinationTokenAccount: destinationTokenAccountPubkey,
                smartDelegate: smartDelegatePubkey,
                preAuthorization: preAuthorizationPubkey,
                tokenProgram: tokenProgramId,
              })
              .signers([debitAuthorityKeypair])
              .rpc(),
          ).to.be.eventually.rejectedWith(
            /Error Code: PreAuthorizationNotActive. Error Number: 6000/,
          );
        });
      },
    );

    context("generic checks that are similar to one-time debits", () => {
      beforeEach(async () => {
        const activationUnixTimestamp =
          Math.floor(new Date().getTime() / 1e3) - 1; // now

        preAuthorizationPubkey = await setupRecurringPreAuthorization(
          activationUnixTimestamp,
          3, // 3 second repeat frequency
          BigInt(50e6), // authorize 50 tokens each cycle
          null, // infinite recurring pre-authorization (num_cycles set to None)
          true, // non-cumulative, i.e. reset_every_cycle is set to true
        );
      });

      it("fails if pre_authorization is paused", async () => {
        await program.methods
          .updatePausePreAuthorization({
            pause: true,
          })
          .accounts({
            owner: userKeypair.publicKey,
            tokenAccount: tokenAccountPubkey,
            preAuthorization: preAuthorizationPubkey,
          })
          .signers([userKeypair])
          .rpc();

        const preAuthorizationBefore =
          await program.account.preAuthorization.fetch(preAuthorizationPubkey);
        expect(preAuthorizationBefore.paused).to.equal(true);

        await expect(
          program.methods
            .debit({ amount: new anchor.BN(50e6) })
            .accounts({
              debitAuthority: debitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: preAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([debitAuthorityKeypair])
            .rpc(),
        ).to.eventually.be.rejectedWith(
          /Error Code: PreAuthorizationPaused. Error Number: 6004/,
        );
      });

      it("fails if pre_authorization is not yet active", async () => {
        await program.methods
          .closePreAuthorization()
          .accounts({
            receiver: userKeypair.publicKey,
            authority: userKeypair.publicKey,
            tokenAccount: tokenAccountPubkey,
            preAuthorization: preAuthorizationPubkey,
          })
          .signers([userKeypair])
          .rpc();

        const activationUnixTimestamp =
          Math.floor(new Date().getTime() / 1e3) + 24 * 60 * 60; // +1 day from now

        preAuthorizationPubkey = await setupRecurringPreAuthorization(
          activationUnixTimestamp,
          3, // 3 second repeat frequency
          BigInt(50e6), // authorize 33 tokens each cycle
          null, // infinite recurring pre-authorization (num_cycles set to None)
          true, // non-cumulative, i.e. reset_every_cycle is set to true
        );

        await expect(
          program.methods
            .debit({ amount: new anchor.BN(50e6) })
            .accounts({
              debitAuthority: debitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: preAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([debitAuthorityKeypair])
            .rpc(),
        ).to.eventually.be.rejectedWith(
          /Error Code: PreAuthorizationNotActive. Error Number: 6000/,
        );
      });

      it("fails if pre_authorization doesn't match with token_account", async () => {
        const newUserKeypair = Keypair.generate();
        const newTokenAccountPubkey = await createAssociatedTokenAccount(
          provider.connection,
          fundedKeypair,
          mintPubkey,
          newUserKeypair.publicKey,
          undefined,
          tokenProgramId,
        );

        await mintTo(
          provider.connection,
          fundedKeypair,
          mintPubkey,
          newTokenAccountPubkey,
          mintAuthorityKeypair,
          1000e6,
          undefined,
          undefined,
          tokenProgramId,
        );

        const activationUnixTimestamp =
          getCurrentUnixTimestamp() - 24 * 60 * 60; // now - 1 day
        const expirationUnixTimestamp =
          activationUnixTimestamp + 10 * 24 * 60 * 60; // now + 10 days

        const [newPreAuthorizationPubkey] = derivePreAuthorization(
          newTokenAccountPubkey,
          debitAuthorityKeypair.publicKey,
          program.programId,
        );

        await program.methods
          .initPreAuthorization({
            variant: {
              oneTime: {
                amountAuthorized: new anchor.BN(100e6),
                expiryUnixTimestamp: new anchor.BN(expirationUnixTimestamp),
              },
            },
            debitAuthority: debitAuthorityKeypair.publicKey,
            activationUnixTimestamp: new anchor.BN(activationUnixTimestamp),
          })
          .accounts({
            payer: provider.publicKey,
            owner: newUserKeypair.publicKey,
            tokenAccount: newTokenAccountPubkey,
            preAuthorization: newPreAuthorizationPubkey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newUserKeypair])
          .rpc();

        // we don't see the actual validation error because the PDA error is hit first
        // it is redundant but we'll leave it in there
        await expect(
          program.methods
            .debit({ amount: new anchor.BN(50e6) })
            .accounts({
              debitAuthority: debitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: newPreAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([debitAuthorityKeypair])
            .rpc(),
        ).to.eventually.be.rejectedWith(
          /AnchorError caused by account: pre_authorization\. Error Code: ConstraintSeeds\. Error Number: 2006\. Error Message: A seeds constraint was violated\./,
        );
      });

      it("fails if debit_authority doesn't match", async () => {
        const newDebitAuthorityKeypair = Keypair.generate();

        // we don't see the actual validation error because the PDA error is hit first
        // it is redundant but we'll leave it in there
        await expect(
          program.methods
            .debit({ amount: new anchor.BN(50e6) })
            .accounts({
              debitAuthority: newDebitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: preAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([newDebitAuthorityKeypair])
            .rpc(),
        ).to.eventually.be.rejectedWith(
          /AnchorError caused by account: pre_authorization\. Error Code: ConstraintSeeds\. Error Number: 2006\. Error Message: A seeds constraint was violated\./,
        );
      });

      it("fires the DebitEvent event", async () => {
        const signature = await program.methods
          .debit({ amount: new anchor.BN(50e6) })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc();

        const tx = await waitForTxToConfirm(signature, provider.connection);
        assert(tx.meta?.logMessages, "tx.meta?.logMessages undefined");

        const eventGenerator = eventParser.parseLogs(tx.meta.logMessages);
        const events = [...eventGenerator];
        expect(events.length).to.equal(1);
        expect(events[0].name).to.equal("DebitEvent");
        const [debitEvent] = events as [DebitEvent];
        expect(Object.keys(debitEvent.data).length).to.equal(10);
        expect(debitEvent.data.debitAuthority.toString()).to.equal(
          debitAuthorityKeypair.publicKey.toBase58(),
        );
        expect(debitEvent.data.preAuthorization.toString()).to.equal(
          preAuthorizationPubkey.toBase58(),
        );
        expect(debitEvent.data.smartDelegate.toString()).to.equal(
          smartDelegatePubkey.toBase58(),
        );
        expect(debitEvent.data.mint.toString()).to.equal(mintPubkey.toBase58());
        expect(debitEvent.data.tokenProgram.toString()).to.equal(
          tokenProgramId.toBase58(),
        );
        expect(debitEvent.data.sourceTokenAccountOwner.toString()).to.equal(
          userKeypair.publicKey.toBase58(),
        );
        expect(
          debitEvent.data.destinationTokenAccountOwner.toString(),
        ).to.equal(destinationTokenAccountOwnerPubkey.toBase58());
        expect(debitEvent.data.sourceTokenAccount.toString()).to.equal(
          tokenAccountPubkey.toBase58(),
        );
        expect(debitEvent.data.destinationTokenAccount.toString()).to.equal(
          destinationTokenAccountPubkey.toBase58(),
        );
        expect(
          JSON.stringify(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (debitEvent.data.debitVariant as any).recurring,
          ),
        ).to.deep.equal(
          JSON.stringify({
            debitAmount: new anchor.BN(50e6),
            cycle: new anchor.BN(1),
          }),
        );
      });
    });

    context("negative timestamps", () => {
      it("fails if activation_timestamp is negative and cycles have ran out", async () => {
        const activationUnixTimestamp = -(
          Math.floor(new Date().getTime() / 1e3) +
          365 * 24 * 60 * 60
        ); // negative value of 1 year from now

        preAuthorizationPubkey = await setupRecurringPreAuthorization(
          activationUnixTimestamp,
          3, // 3 second repeat frequency
          BigInt(33e6), // authorize 33 tokens each cycle
          2, // finite to 2 cycles
          false, // cumulative, i.e. reset_every_cycle is set to false
        );

        await expect(
          program.methods
            .debit({ amount: new anchor.BN(50e6) })
            .accounts({
              debitAuthority: debitAuthorityKeypair.publicKey,
              mint: mintPubkey,
              tokenAccount: tokenAccountPubkey,
              destinationTokenAccount: destinationTokenAccountPubkey,
              smartDelegate: smartDelegatePubkey,
              preAuthorization: preAuthorizationPubkey,
              tokenProgram: tokenProgramId,
            })
            .signers([debitAuthorityKeypair])
            .rpc(),
        ).to.eventually.be.rejectedWith(
          /Error Code: PreAuthorizationNotActive. Error Number: 6000/,
        );
      });

      it("allows debit if activation_timestamp is negative but there is no cycle limit", async () => {
        const activationUnixTimestamp = -(
          Math.floor(new Date().getTime() / 1e3) +
          365 * 24 * 60 * 60
        ); // negative value of 1 year from now

        preAuthorizationPubkey = await setupRecurringPreAuthorization(
          activationUnixTimestamp,
          3, // 3 second repeat frequency
          BigInt(33e6), // authorize 33 tokens each cycle
          null, // infinite
          true, // non-cumulative, i.e. reset_every_cycle is set to true
        );

        const destinationTokenAccountBefore = await getAccount(
          provider.connection,
          destinationTokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        await program.methods
          .debit({ amount: new anchor.BN(33e6) })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc();

        const destinationTokenAccountAfter = await getAccount(
          provider.connection,
          destinationTokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        expect(
          destinationTokenAccountAfter.amount -
            destinationTokenAccountBefore.amount,
        ).to.equal(BigInt(33e6));
      });

      it("allows cumulative debit if activation_timestamp is negative but there is a large cycle limit", async () => {
        await mintTo(
          provider.connection,
          fundedKeypair,
          mintPubkey,
          tokenAccountPubkey,
          mintAuthorityKeypair,
          // u64::max - 1000e6, because we already minted 1000e6 in before each
          BigInt(2) ** BigInt(64) - BigInt(1 + 1000e6), // mint maximum tokens
          undefined,
          undefined,
          tokenProgramId,
        );

        const activationUnixTimestamp = -(365 * 24 * 60 * 60); // 1 year before epoch 0

        const amountPerCycle = BigInt(33e6);
        const cycleLimit = BigInt(2) ** BigInt(32) - BigInt(1);

        preAuthorizationPubkey = await setupRecurringPreAuthorization(
          activationUnixTimestamp,
          3, // 3 second repeat frequency
          amountPerCycle, // authorize 33 tokens each cycle
          cycleLimit, // finite, but a lot of cycles (u32::max)
          false, // cumulative, i.e. reset_every_cycle is set to false
        );

        const now = Math.floor(new Date().getTime() / 1e3);
        const cyclesElapsed =
          (BigInt(now) - BigInt(activationUnixTimestamp)) / BigInt(3);

        const accumulatedAvailableAmount = amountPerCycle * cyclesElapsed;

        const destinationTokenAccountBefore = await getAccount(
          provider.connection,
          destinationTokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        await program.methods
          .debit({
            amount: new anchor.BN(accumulatedAvailableAmount.toString()),
          })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc();

        const destinationTokenAccountAfter = await getAccount(
          provider.connection,
          destinationTokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        expect(
          destinationTokenAccountAfter.amount -
            destinationTokenAccountBefore.amount,
        ).to.equal(accumulatedAvailableAmount);
      });
    });
  });
}

async function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1e3);
  });
}
