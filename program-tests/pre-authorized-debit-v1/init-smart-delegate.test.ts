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
  deriveInvalidSmartDelegate,
  deriveSmartDelegate,
  fundAccounts,
} from "./utils";
import {
  createMint,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

describe("pre-authorized-debit-v1#init-smart-delegate", () => {
  const program =
    workspace.PreAuthorizedDebitV1 as Program<PreAuthorizedDebitV1>;
  const eventParser = new EventParser(
    program.programId,
    new BorshCoder(program.idl)
  );
  const provider = program.provider as AnchorProvider;

  let payer: Keypair;
  let owner: Keypair;
  let mintAuthority: Keypair;

  let mint: PublicKey;

  beforeEach(async () => {
    mintAuthority = new Keypair();
    payer = new Keypair();
    owner = new Keypair();

    await fundAccounts(
      provider,
      [payer.publicKey, owner.publicKey, mintAuthority.publicKey],
      1_000_000_000
    );
  });

  [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].forEach((tokenProgramId) => {
    context(`with token program ${tokenProgramId.toString()}`, () => {
      it(`should create a smart delegate with token account`, async () => {
        mint = await createMint(
          provider.connection,
          mintAuthority,
          mintAuthority.publicKey,
          null,
          6,
          new Keypair(),
          {
            commitment: "confirmed",
          },
          tokenProgramId
        );
        const tokenAccount = await createAssociatedTokenAccount(
          provider.connection,
          payer,
          mint,
          owner.publicKey,
          {
            commitment: "confirmed",
          },
          tokenProgramId
        );
        const smartDelegate = deriveSmartDelegate(
          tokenAccount,
          program.programId
        );

        const [payerAccountInfoBefore, ownerAccountInfoBefore] =
          await Promise.all([
            provider.connection.getAccountInfo(payer.publicKey),
            provider.connection.getAccountInfo(owner.publicKey),
          ]);
        assert(payerAccountInfoBefore && ownerAccountInfoBefore);

        const signature = await program.methods
          .initSmartDelegate()
          .accounts({
            payer: payer.publicKey,
            owner: owner.publicKey,
            tokenAccount: tokenAccount,
            smartDelegate: smartDelegate,
            tokenProgram: tokenProgramId,
            systemProgram: SystemProgram.programId,
          })
          .signers([payer, owner])
          .rpc({
            commitment: "confirmed",
          });
        const tx = await provider.connection.getTransaction(signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        assert(tx);
        assert(tx.meta?.logMessages);

        // verify events
        const eventGenerator = eventParser.parseLogs(tx.meta.logMessages);
        const events = [...eventGenerator];
        expect(events.length).to.equal(1);
        const [smartDelegateEvent] = events;
        expect(smartDelegateEvent).to.not.be.null;
        expect(smartDelegateEvent.name).to.equal("SmartDelegateInitialized");
        expect(Object.keys(smartDelegateEvent.data).length).to.equal(6);
        expect(smartDelegateEvent.data.payer!.toString()).to.equal(
          payer.publicKey.toString()
        );
        expect(smartDelegateEvent.data.owner!.toString()).to.equal(
          owner.publicKey.toString()
        );
        expect(smartDelegateEvent.data.tokenAccount!.toString()).to.equal(
          tokenAccount.toString()
        );
        expect(smartDelegateEvent.data.mint!.toString()).to.equal(
          mint.toString()
        );
        expect(smartDelegateEvent.data.tokenProgram!.toString()).to.equal(
          tokenProgramId.toString()
        );
        expect(smartDelegateEvent.data.smartDelegate!.toString()).to.equal(
          smartDelegate.toString()
        );

        // verify sol balances
        const [payerAccountInfoAfter, ownerAccountInfoAfter] =
          await Promise.all([
            provider.connection.getAccountInfo(payer.publicKey),
            provider.connection.getAccountInfo(owner.publicKey),
          ]);
        assert(payerAccountInfoAfter && ownerAccountInfoAfter);
        expect(ownerAccountInfoBefore.lamports).to.equal(
          ownerAccountInfoAfter.lamports
        );
        expect(payerAccountInfoAfter.lamports).to.be.lessThan(
          payerAccountInfoBefore.lamports
        );

        // verify smart delegate account
        const smartDelegateAccount = await program.account.smartDelegate.fetch(
          smartDelegate
        );
        expect(smartDelegateAccount.tokenAccount.toString()).to.equal(
          tokenAccount.toString()
        );
      });
    });
  });

  it("should throw an error if the owner is not the token account owner", async () => {
    mint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      6,
      new Keypair(),
      {
        commitment: "confirmed",
      },
      TOKEN_PROGRAM_ID
    );
    const tokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      mint,
      payer.publicKey,
      {
        commitment: "confirmed",
      },
      TOKEN_PROGRAM_ID
    );
    const smartDelegate = deriveSmartDelegate(tokenAccount, program.programId);
    await expect(
      program.methods
        .initSmartDelegate()
        .accounts({
          payer: payer.publicKey,
          owner: owner.publicKey,
          tokenAccount: tokenAccount,
          smartDelegate: smartDelegate,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer, owner])
        .rpc()
    ).to.eventually.be.rejectedWith(
      /AnchorError caused by account: token_account. Error Code: InitSmartDelegateUnauthorized. Error Number: 6012. Error Message: Only token account owner can initialize a smart delegate./
    );
  });

  it("should throw an error with a non-canonical smart delegate", async () => {
    mint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      6,
      new Keypair(),
      {
        commitment: "confirmed",
      },
      TOKEN_PROGRAM_ID
    );
    const tokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      mint,
      owner.publicKey,
      {
        commitment: "confirmed",
      },
      TOKEN_PROGRAM_ID
    );
    const validSmartDelegate = deriveSmartDelegate(
      tokenAccount,
      program.programId
    );
    const invalidSmartDelegate = deriveInvalidSmartDelegate(
      tokenAccount,
      program.programId
    );
    await expect(
      program.methods
        .initSmartDelegate()
        .accounts({
          payer: payer.publicKey,
          owner: owner.publicKey,
          tokenAccount: tokenAccount,
          smartDelegate: invalidSmartDelegate,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer, owner])
        .rpc()
    ).to.eventually.to.be.rejectedWith(
      /AnchorError caused by account: smart_delegate. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated./
    );
  });
});
