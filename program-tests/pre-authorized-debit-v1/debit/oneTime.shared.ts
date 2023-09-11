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
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  mintTo,
  createApproveInstruction,
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

export function testOneTimeDebit(
  tokenProgramId: PublicKey,
  testSuffix: string,
) {
  describe(`pre-authorized-debit-v1#debit (one-time) ${testSuffix}`, () => {
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const program = anchor.workspace
      .PreAuthorizedDebitV1 as anchor.Program<PreAuthorizedDebitV1>;
    const eventParser = new anchor.EventParser(
      program.programId,
      program.coder,
    );

    let fundedKeypair: Keypair,
      mintAuthorityKeypair: Keypair,
      debitAuthorityKeypair: Keypair,
      userKeypair: Keypair;

    let tokenAccountPubkey: PublicKey,
      mintPubkey: PublicKey,
      smartDelegatePubkey: PublicKey,
      preAuthorizationPubkey: PublicKey,
      destinationTokenAccountOwnerPubkey: PublicKey,
      destinationTokenAccountPubkey: PublicKey;

    before(async () => {
      smartDelegatePubkey = await initSmartDelegateIdempotent(
        program,
        provider,
      );
    });

    async function setupOneTimePreAuthorization(
      activationUnixTimestamp: number,
      expirationUnixTimestamp: number,
    ): Promise<PublicKey> {
      const [preAuthorizationPubkey] = derivePreAuthorization(
        tokenAccountPubkey,
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

      const activationUnixTimestamp =
        Math.floor(new Date().getTime() / 1e3) - 60; // -60 seconds from now

      const expirationUnixTimestamp =
        activationUnixTimestamp + 10 * 24 * 60 * 60; // +10 days from activation

      preAuthorizationPubkey = await setupOneTimePreAuthorization(
        activationUnixTimestamp,
        expirationUnixTimestamp,
      );
    });

    it("allows debit_authority to debit funds", async () => {
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
        preAuthorizationBefore.variant.oneTime?.amountDebited.toString(),
      ).to.equal("0");

      await program.methods
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
        (50e6).toString(),
      );
      expect(sourceTokenAccountAfter.amount.toString()).to.equal(
        (950e6).toString(),
      );
      expect(sourceTokenAccountAfter.delegate?.toBase58()).to.equal(
        smartDelegatePubkey.toBase58(),
      );
      expect(sourceTokenAccountAfter.delegatedAmount.toString()).to.equal(
        (BigInt(U64_MAX) - BigInt(50e6)).toString(),
      );
      expect(
        preAuthorizationAfter.variant.oneTime?.amountDebited.toString(),
      ).to.equal((50e6).toString());
      expect({
        ...preAuthorizationBefore,
        variant: {
          oneTime: {
            ...preAuthorizationBefore.variant.oneTime,
            amountDebited: null,
          },
        },
      }).to.deep.equal({
        ...preAuthorizationAfter,
        variant: {
          oneTime: {
            ...preAuthorizationAfter.variant.oneTime,
            amountDebited: null,
          },
        },
      });
    });

    context("partial debits", () => {
      async function partialDebitNTimes(
        n: number,
        amount: number,
      ): Promise<void> {
        for (let i = 0; i < n; i++) {
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
            await program.account.preAuthorization.fetch(
              preAuthorizationPubkey,
            );

          expect(destinationTokenAccountBefore.amount.toString()).to.equal(
            (i * amount).toString(),
          );
          expect(sourceTokenAccountBefore.amount.toString()).to.equal(
            (1000e6 - i * amount).toString(),
          );
          expect(sourceTokenAccountBefore.delegate?.toBase58()).to.equal(
            smartDelegatePubkey.toBase58(),
          );
          expect(sourceTokenAccountBefore.delegatedAmount.toString()).to.equal(
            (BigInt(U64_MAX) - BigInt(i * amount)).toString(),
          );
          expect(
            preAuthorizationBefore.variant.oneTime?.amountDebited.toString(),
          ).to.equal((i * amount).toString());

          await program.methods
            .debit({ amount: new anchor.BN(amount) })
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
            ((i + 1) * amount).toString(),
          );
          expect(sourceTokenAccountAfter.amount.toString()).to.equal(
            (1000e6 - (i + 1) * amount).toString(),
          );
          expect(sourceTokenAccountAfter.delegate?.toBase58()).to.equal(
            smartDelegatePubkey.toBase58(),
          );
          expect(sourceTokenAccountAfter.delegatedAmount.toString()).to.equal(
            (BigInt(U64_MAX) - BigInt((i + 1) * amount)).toString(),
          );
          expect(
            preAuthorizationAfter.variant.oneTime?.amountDebited.toString(),
          ).to.equal(((i + 1) * amount).toString());
          expect({
            ...preAuthorizationBefore,
            variant: {
              oneTime: {
                ...preAuthorizationBefore.variant.oneTime,
                amountDebited: null,
              },
            },
          }).to.deep.equal({
            ...preAuthorizationAfter,
            variant: {
              oneTime: {
                ...preAuthorizationAfter.variant.oneTime,
                amountDebited: null,
              },
            },
          });
        }
      }

      it("should allow partial debits to a total of authorized amount", async () => {
        const partialWithdrawAmount = 25e6;
        await partialDebitNTimes(4, partialWithdrawAmount);
        const preAuthorizationAfter =
          await program.account.preAuthorization.fetch(preAuthorizationPubkey);
        expect(
          preAuthorizationAfter.variant.oneTime?.amountDebited.toString(),
        ).to.equal((4 * partialWithdrawAmount).toString());
        expect(preAuthorizationAfter.debitAuthority.toString()).to.equal(
          debitAuthorityKeypair.publicKey.toString(),
        );
        expect(preAuthorizationAfter.paused).to.equal(false);
      });

      it("should not allow debiting after debiting a total of authorized amount", async () => {
        const partialWithdrawAmount = 25e6;
        await partialDebitNTimes(4, partialWithdrawAmount);
        await expect(
          program.methods
            .debit({ amount: new anchor.BN(partialWithdrawAmount) })
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
          /Error Code: CannotDebitMoreThanAvailable. Error Number: 6001. Error Message: Cannot debit more than authorized/,
        );
      });

      it("should not allow debiting more then authorized amount in a partial debit", async () => {
        const partialWithdrawAmount = 25e6;
        await partialDebitNTimes(3, partialWithdrawAmount);
        await expect(
          program.methods
            .debit({ amount: new anchor.BN(2 * partialWithdrawAmount) })
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
          /Error Code: CannotDebitMoreThanAvailable. Error Number: 6001. Error Message: Cannot debit more than authorized/,
        );
      });
    });

    context("negative timestamps", () => {
      it("fails if expiry is negative", async () => {
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
          Math.floor(new Date().getTime() / 1e3) - 24 * 60 * 60; // -1 day before now

        const expirationUnixTimestamp = -(
          activationUnixTimestamp +
          10 * 24 * 60 * 60 -
          1
        ); // negative(+10 days from now) (so thousands of year before epoch 0)

        await setupOneTimePreAuthorization(
          activationUnixTimestamp,
          expirationUnixTimestamp,
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
      it("fails when activation_timestamp < 0 && 0 < expiry_timestamp < now && abs(activation_timestamp) > expiry_timestamp", async () => {
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

        const activationUnixTimestamp = -(
          Math.floor(new Date().getTime() / 1e3) -
          24 * 60 * 60
        ); // negative(-1 day before now)

        const expirationUnixTimestamp =
          Math.floor(new Date().getTime() / 1e3) - 2 * 24 * 60 * 60; // -2 days before now

        await setupOneTimePreAuthorization(
          activationUnixTimestamp,
          expirationUnixTimestamp,
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
      it("allows debit when activation_timestamp < 0 && expiry_timestamp > now  && abs(activation_timestamp) > expiry_timestamp", async () => {
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

        const activationUnixTimestamp = -(
          Math.floor(new Date().getTime() / 1e3) +
          20 * 24 * 60 * 60
        ); // negative(+20 days from now)

        const expirationUnixTimestamp =
          Math.floor(new Date().getTime() / 1e3) + 10 * 24 * 60 * 60; // +10 days from now

        await setupOneTimePreAuthorization(
          activationUnixTimestamp,
          expirationUnixTimestamp,
        );

        const destinationTokenAccountBefore = await getAccount(
          provider.connection,
          destinationTokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        await program.methods
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

        const destinationTokenAccountAfter = await getAccount(
          provider.connection,
          destinationTokenAccountPubkey,
          undefined,
          tokenProgramId,
        );

        expect(
          destinationTokenAccountAfter.amount -
            destinationTokenAccountBefore.amount,
        ).to.equal(BigInt(50e6));
      });
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

      const expirationUnixTimestamp =
        activationUnixTimestamp + 10 * 24 * 60 * 60; // +11 days from now

      await setupOneTimePreAuthorization(
        activationUnixTimestamp,
        expirationUnixTimestamp,
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

    it("fails if pre_authorization is already expired", async () => {
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
        Math.floor(new Date().getTime() / 1e3) - 24 * 60 * 60; // -1 day from now

      const expirationUnixTimestamp =
        activationUnixTimestamp + 24 * 60 * 60 - 1; // -1 second from now

      await setupOneTimePreAuthorization(
        activationUnixTimestamp,
        expirationUnixTimestamp,
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

    it("fails if attempting to debit more than pre_authorization initial authorization", async () => {
      await expect(
        program.methods
          .debit({ amount: new anchor.BN(101e6) })
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
        /Error Code: CannotDebitMoreThanAvailable. Error Number: 6001/,
      );
    });

    it("fails if attempting to debit more than pre_authorization's remaining available amount", async () => {
      await program.methods
        .debit({ amount: new anchor.BN(95e6) })
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
          .debit({ amount: new anchor.BN(5e6 + 1) })
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
        /Error Code: CannotDebitMoreThanAvailable. Error Number: 6001/,
      );

      await program.methods
        .debit({ amount: new anchor.BN(5e6) })
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

      const activationUnixTimestamp = getCurrentUnixTimestamp() - 24 * 60 * 60; // now - 1 day
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
      expect(debitEvent.data.destinationTokenAccountOwner.toString()).to.equal(
        destinationTokenAccountOwnerPubkey.toBase58(),
      );
      expect(debitEvent.data.sourceTokenAccount.toString()).to.equal(
        tokenAccountPubkey.toBase58(),
      );
      expect(debitEvent.data.destinationTokenAccount.toString()).to.equal(
        destinationTokenAccountPubkey.toBase58(),
      );
      expect(
        JSON.stringify(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (debitEvent.data.debitVariant as any).oneTime,
        ),
      ).to.deep.equal(
        JSON.stringify({
          debitAmount: new anchor.BN(50e6),
        }),
      );
    });
  });
}
