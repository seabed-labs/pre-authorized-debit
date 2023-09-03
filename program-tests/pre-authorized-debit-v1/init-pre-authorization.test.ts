import "./setup";

import {
  AnchorProvider,
  BorshCoder,
  EventParser,
  Program,
  workspace,
} from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { PreAuthorizedDebitV1 } from "../../target/types/pre_authorized_debit_v1";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
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

describe("pre-authorized-debit-v1#init-pre-authorization", () => {
  const program =
    workspace.PreAuthorizedDebitV1 as Program<PreAuthorizedDebitV1>;
  const eventParser = new EventParser(
    program.programId,
    new BorshCoder(program.idl),
  );
  const provider = program.provider as AnchorProvider;

  let payer: Keypair;
  let owner: Keypair;
  let mintAuthority: Keypair;
  let debitAuthority: Keypair;

  beforeEach(async () => {
    mintAuthority = new Keypair();
    payer = new Keypair();
    owner = new Keypair();
    debitAuthority = new Keypair();

    await fundAccounts(
      provider,
      [
        payer.publicKey,
        owner.publicKey,
        mintAuthority.publicKey,
        debitAuthority.publicKey,
      ],
      500_000_000,
    );
  });

  [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].forEach((tokenProgramId) => {
    context(`with token program ${tokenProgramId.toString()}`, () => {
      const activationUnixTimestamp =
        Math.floor(new Date().getTime() / 1e3) - 60; // -60 seconds from now
      const expirationUnixTimestamp =
        activationUnixTimestamp + 10 * 24 * 60 * 60; // +10 days from activation

      let mint: PublicKey;
      let validTokenAccount: PublicKey;

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
        validTokenAccount = await createAccount(
          provider.connection,
          payer,
          mint,
          owner.publicKey,
          new Keypair(),
          undefined,
          tokenProgramId,
        );
        await mintTo(
          provider.connection,
          payer,
          mint,
          validTokenAccount,
          mintAuthority,
          1_000_000,
          undefined,
          undefined,
          tokenProgramId,
        );
      });

      ["one time", "recurring"].forEach((preAuthType: string) => {
        context(`with ${preAuthType} variant`, () => {
          it(`should create a pre authorization`, async () => {
            const tokenAccountDataBefore = await getAccount(
              provider.connection,
              validTokenAccount,
              undefined,
              tokenProgramId,
            );
            expect(tokenAccountDataBefore.amount.toString()).to.equal(
              "1000000",
            );

            const [payerAccountInfoBefore, ownerAccountInfoBefore] =
              await Promise.all([
                provider.connection.getAccountInfo(payer.publicKey),
                provider.connection.getAccountInfo(owner.publicKey),
              ]);
            assert(payerAccountInfoBefore && ownerAccountInfoBefore);

            const preAuthorization = derivePreAuthorization(
              validTokenAccount,
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
                preAuthorization: preAuthorization,
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
            expect(initPreAuthEvent).to.not.be.null;
            if (preAuthType === "one time") {
              expect(initPreAuthEvent.name).to.equal(
                "OneTimePreAuthorizationCreated",
              );
            } else {
              expect(initPreAuthEvent.name).to.equal(
                "RecurringPreAuthorizationCreated",
              );
            }
            expect(Object.keys(initPreAuthEvent.data).length).to.equal(1);
            const initPreAuthEventData = initPreAuthEvent.data.data as any;
            expect(Object.keys(initPreAuthEventData).length).to.equal(5);

            expect(initPreAuthEventData.debitAuthority!.toString()).to.equal(
              debitAuthority.publicKey.toString(),
            );
            expect(initPreAuthEventData.owner!.toString()).to.equal(
              owner.publicKey.toString(),
            );
            expect(initPreAuthEventData.payer!.toString()).to.equal(
              payer.publicKey.toString(),
            );

            expect(initPreAuthEventData.tokenAccount!.toString()).to.equal(
              validTokenAccount.toString(),
            );
            expect(initPreAuthEventData.preAuthorization!.toString()).to.equal(
              preAuthorization.toString(),
            );

            // verify sol balances
            let [payerAccountInfoAfter, ownerAccountInfoAfter] =
              await Promise.all([
                provider.connection.getAccountInfo(payer.publicKey),
                provider.connection.getAccountInfo(owner.publicKey),
              ]);
            assert(payerAccountInfoAfter && ownerAccountInfoAfter);
            expect(ownerAccountInfoBefore.lamports).to.equal(
              ownerAccountInfoAfter.lamports,
            );
            // should use payers sol to create the account
            expect(payerAccountInfoAfter.lamports).to.be.lessThan(
              payerAccountInfoBefore.lamports,
            );

            // verify smart delegate account closed
            // const smartDelegateAccount = await provider.connection.getAccountInfo(
            //   smartDelegate
            // );
            // expect(smartDelegateAccount).to.be.null;

            // verify token account balance is unchanged
            const tokenAccountDataAfter = await getAccount(
              provider.connection,
              validTokenAccount,
              undefined,
              tokenProgramId,
            );
            expect(tokenAccountDataAfter.amount.toString()).to.equal("1000000");
          });
        });
      });

      it("should throw an error if the owner does not sign", async () => {
        const preAuthorization = derivePreAuthorization(
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
              preAuthorization: preAuthorization,
              systemProgram: SystemProgram.programId,
            })
            .signers([payer])
            .rpc({
              skipPreflight: true,
            }),
        ).to.eventually.be.rejectedWith(/Signature verification failed/);
      });

      it("should throw an error if the owner does not own the token account", async () => {
        const preAuthorization = derivePreAuthorization(
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
              owner: debitAuthority.publicKey,
              tokenAccount: validTokenAccount,
              preAuthorization: preAuthorization,
              systemProgram: SystemProgram.programId,
            })
            .signers([debitAuthority, payer])
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
              preAuthorization: preAuthorization,
              systemProgram: SystemProgram.programId,
            })
            .signers([owner, payer])
            .rpc(),
        ).to.eventually.be.rejectedWith(
          /AnchorError caused by account: pre_authorization. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated./,
        );
      });

      it("should throw an error if the system program is not valid", async () => {
        const preAuthorization = derivePreAuthorization(
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
              preAuthorization: preAuthorization,
              systemProgram: tokenProgramId,
            })
            .signers([owner, payer])
            .rpc(),
        ).to.eventually.be.rejectedWith(
          /AnchorError caused by account: system_program. Error Code: InvalidProgramId. Error Number: 3008. Error Message: Program ID was not as expected./,
        );
      });
    });
  });
});
