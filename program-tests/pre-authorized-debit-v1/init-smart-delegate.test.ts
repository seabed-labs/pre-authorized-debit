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
  U64_MAX,
  deriveInvalidSmartDelegate,
  deriveSmartDelegate,
  fundAccounts,
  waitForTxToConfirm,
} from "./utils";
import {
  createMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  createAccount,
} from "@solana/spl-token";

describe("pre-authorized-debit-v1#init-smart-delegate", () => {
  const program =
    workspace.PreAuthorizedDebitV1 as Program<PreAuthorizedDebitV1>;
  const eventParser = new EventParser(program.programId, program.coder);
  const provider = program.provider as AnchorProvider;

  let payer: Keypair, owner: Keypair, mintAuthority: Keypair;
  let mint: PublicKey;

  beforeEach(async () => {
    mintAuthority = Keypair.generate();
    payer = Keypair.generate();
    owner = Keypair.generate();

    await fundAccounts(
      provider,
      [payer.publicKey, owner.publicKey, mintAuthority.publicKey],
      500e6,
    );
  });

  [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].forEach((tokenProgramId) => {
    context(`with token program ${tokenProgramId.toString()}`, () => {
      it("should create a smart delegate", async () => {
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
        const tokenAccount = await createAccount(
          provider.connection,
          payer,
          mint,
          owner.publicKey,
          new Keypair(),
          undefined,
          tokenProgramId,
        );
        const [smartDelegate, smartDelegateBump] = deriveSmartDelegate(
          tokenAccount,
          program.programId,
        );

        const [payerAccountInfoBefore, ownerAccountInfoBefore] =
          await provider.connection.getMultipleAccountsInfo([
            payer.publicKey,
            owner.publicKey,
          ]);
        assert(payerAccountInfoBefore && ownerAccountInfoBefore);

        const signature = await program.methods
          .initSmartDelegate()
          .accounts({
            payer: payer.publicKey,
            owner: owner.publicKey,
            tokenAccount,
            smartDelegate,
            tokenProgram: tokenProgramId,
            systemProgram: SystemProgram.programId,
          })
          .signers([payer, owner])
          .rpc();
        const tx = await waitForTxToConfirm(signature, provider.connection);
        assert(tx.meta?.logMessages);

        // verify events
        const eventGenerator = eventParser.parseLogs(tx.meta.logMessages);
        const events = [...eventGenerator];
        expect(events.length).to.equal(1);
        const [smartDelegateEvent] = events;
        expect(smartDelegateEvent).to.not.equal(null);
        expect(smartDelegateEvent.name).to.equal("SmartDelegateInitialized");
        expect(Object.keys(smartDelegateEvent.data).length).to.equal(6);
        expect(smartDelegateEvent.data.payer!.toString()).to.equal(
          payer.publicKey.toString(),
        );
        expect(smartDelegateEvent.data.owner!.toString()).to.equal(
          owner.publicKey.toString(),
        );
        expect(smartDelegateEvent.data.tokenAccount!.toString()).to.equal(
          tokenAccount.toString(),
        );
        expect(smartDelegateEvent.data.mint!.toString()).to.equal(
          mint.toString(),
        );
        expect(smartDelegateEvent.data.tokenProgram!.toString()).to.equal(
          tokenProgramId.toString(),
        );
        expect(smartDelegateEvent.data.smartDelegate!.toString()).to.equal(
          smartDelegate.toString(),
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
        expect(payerAccountInfoAfter.lamports).to.be.lessThan(
          payerAccountInfoBefore.lamports,
        );

        // verify smart delegate account
        const smartDelegateAccount =
          await program.account.smartDelegate.fetch(smartDelegate);
        expect(smartDelegateAccount.tokenAccount.toString()).to.equal(
          tokenAccount.toString(),
        );
        expect(smartDelegateAccount.bump).to.equal(smartDelegateBump);

        // verify token account delegate
        const tokenAccountData = await getAccount(
          provider.connection,
          tokenAccount,
          undefined,
          tokenProgramId,
        );
        expect(tokenAccountData.delegate!.toString()).to.equal(
          smartDelegate.toString(),
        );
        expect(tokenAccountData.delegatedAmount.toString()).to.equal(
          U64_MAX.toString(),
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
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const tokenAccount = await createAccount(
      provider.connection,
      payer,
      mint,
      payer.publicKey,
      new Keypair(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const [smartDelegate] = deriveSmartDelegate(
      tokenAccount,
      program.programId,
    );
    await expect(
      program.methods
        .initSmartDelegate()
        .accounts({
          payer: payer.publicKey,
          owner: owner.publicKey,
          tokenAccount,
          smartDelegate,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer, owner])
        .rpc(),
    ).to.eventually.be.rejectedWith(
      /AnchorError caused by account: token_account. Error Code: InitSmartDelegateUnauthorized. Error Number: 6012. Error Message: Only token account owner can initialize a smart delegate./,
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
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const tokenAccount = await createAccount(
      provider.connection,
      payer,
      mint,
      owner.publicKey,
      new Keypair(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const invalidSmartDelegate = deriveInvalidSmartDelegate(
      tokenAccount,
      program.programId,
    );
    await expect(
      program.methods
        .initSmartDelegate()
        .accounts({
          payer: payer.publicKey,
          owner: owner.publicKey,
          tokenAccount,
          smartDelegate: invalidSmartDelegate,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer, owner])
        .rpc(),
    ).to.eventually.to.be.rejectedWith(
      /AnchorError caused by account: smart_delegate. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated./,
    );
  });

  it("should throw an error with an invalid token program id", async () => {
    mint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      6,
      new Keypair(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const tokenAccount = await createAccount(
      provider.connection,
      payer,
      mint,
      owner.publicKey,
      new Keypair(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const [smartDelegate] = deriveSmartDelegate(
      tokenAccount,
      program.programId,
    );
    await expect(
      program.methods
        .initSmartDelegate()
        .accounts({
          payer: payer.publicKey,
          owner: owner.publicKey,
          tokenAccount,
          smartDelegate,
          tokenProgram: SystemProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer, owner])
        .rpc(),
    ).to.eventually.to.be.rejectedWith(
      /AnchorError caused by account: token_program. Error Code: InvalidProgramId. Error Number: 3008. Error Message: Program ID was not as expected./,
    );
  });

  it("should throw an error with an invalid system program id", async () => {
    mint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      6,
      new Keypair(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const tokenAccount = await createAccount(
      provider.connection,
      payer,
      mint,
      owner.publicKey,
      new Keypair(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const [smartDelegate] = deriveSmartDelegate(
      tokenAccount,
      program.programId,
    );
    await expect(
      program.methods
        .initSmartDelegate()
        .accounts({
          payer: payer.publicKey,
          owner: owner.publicKey,
          tokenAccount,
          smartDelegate,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([payer, owner])
        .rpc(),
    ).to.eventually.to.be.rejectedWith(
      /AnchorError caused by account: system_program. Error Code: InvalidProgramId. Error Number: 3008. Error Message: Program ID was not as expected./,
    );
  });
});
