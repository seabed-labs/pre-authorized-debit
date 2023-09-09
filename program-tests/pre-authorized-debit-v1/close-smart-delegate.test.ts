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
import { deriveSmartDelegate, fundAccounts, waitForTxToConfirm } from "./utils";
import {
  createMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  createAccount,
  approve,
} from "@solana/spl-token";

describe("pre-authorized-debit-v1#close-smart-delegate", () => {
  const program =
    workspace.PreAuthorizedDebitV1 as Program<PreAuthorizedDebitV1>;
  const provider = program.provider as AnchorProvider;
  const eventParser = new EventParser(program.programId, program.coder);

  let receiver: Keypair, owner: Keypair, mintAuthority: Keypair;

  beforeEach(async () => {
    mintAuthority = Keypair.generate();
    receiver = Keypair.generate();
    owner = Keypair.generate();

    await fundAccounts(
      provider,
      [receiver.publicKey, owner.publicKey, mintAuthority.publicKey],
      500e6,
    );
  });

  async function verifyCloseSmartDelegateEvent(
    signature: string,
    expectedReceiver: PublicKey,
    expectedOwner: PublicKey,
    expectedSmartDelegate: PublicKey,
    expectedTokenAccount: PublicKey,
    expectedTokenProgramId: PublicKey,
  ): Promise<void> {
    const tx = await waitForTxToConfirm(signature, provider.connection);
    assert(tx.meta?.logMessages);

    // verify events
    const eventGenerator = eventParser.parseLogs(tx.meta.logMessages);
    const events = [...eventGenerator];
    expect(events.length).to.equal(1);
    const [smartDelegateEvent] = events;
    expect(smartDelegateEvent.name).to.equal("SmartDelegateClosed");
    expect(Object.keys(smartDelegateEvent.data).length).to.equal(5);
    expect(smartDelegateEvent.data.receiver!.toString()).to.equal(
      expectedReceiver.toString(),
    );
    expect(smartDelegateEvent.data.owner!.toString()).to.equal(
      expectedOwner.toString(),
    );
    expect(smartDelegateEvent.data.smartDelegate!.toString()).to.equal(
      expectedSmartDelegate.toString(),
    );
    expect(smartDelegateEvent.data.tokenAccount!.toString()).to.equal(
      expectedTokenAccount.toString(),
    );
    expect(smartDelegateEvent.data.tokenProgram!.toString()).to.equal(
      expectedTokenProgramId.toString(),
    );
  }

  [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].forEach((tokenProgramId) => {
    describe(`with token program ${tokenProgramId.toString()}`, () => {
      let mint: PublicKey,
        validTokenAccount: PublicKey,
        smartDelegate: PublicKey;

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
          receiver,
          mint,
          owner.publicKey,
          Keypair.generate(),
          undefined,
          tokenProgramId,
        );
        [smartDelegate] = deriveSmartDelegate(
          validTokenAccount,
          program.programId,
        );
        await program.methods
          .initSmartDelegate()
          .accounts({
            payer: program.provider.publicKey,
            owner: owner.publicKey,
            tokenAccount: validTokenAccount,
            smartDelegate,
            tokenProgram: tokenProgramId,
            systemProgram: SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
      });

      it("should close a smart delegate", async () => {
        const tokenAccountDataBefore = await getAccount(
          provider.connection,
          validTokenAccount,
          undefined,
          tokenProgramId,
        );
        expect(tokenAccountDataBefore.delegate).to.not.equal(null);
        expect(tokenAccountDataBefore.delegatedAmount.toString()).to.not.equal(
          "0",
        );

        const [receiverAccountInfoBefore, ownerAccountInfoBefore] =
          await provider.connection.getMultipleAccountsInfo([
            receiver.publicKey,
            owner.publicKey,
          ]);
        assert(receiverAccountInfoBefore && ownerAccountInfoBefore);
        const signature = await program.methods
          .closeSmartDelegate()
          .accounts({
            receiver: receiver.publicKey,
            owner: owner.publicKey,
            tokenAccount: validTokenAccount,
            smartDelegate,
            tokenProgram: tokenProgramId,
          })
          .signers([owner])
          .rpc();

        await verifyCloseSmartDelegateEvent(
          signature,
          receiver.publicKey,
          owner.publicKey,
          smartDelegate,
          validTokenAccount,
          tokenProgramId,
        );

        // verify sol balances
        const [receiverAccountInfoAfter, ownerAccountInfoAfter] =
          await provider.connection.getMultipleAccountsInfo([
            receiver.publicKey,
            owner.publicKey,
          ]);
        assert(receiverAccountInfoAfter && ownerAccountInfoAfter);
        expect(ownerAccountInfoBefore.lamports).to.equal(
          ownerAccountInfoAfter.lamports,
        );
        // should refund sol to receiver
        expect(receiverAccountInfoAfter.lamports).to.be.greaterThan(
          receiverAccountInfoBefore.lamports,
        );

        // verify smart delegate account closed
        const smartDelegateAccount =
          await provider.connection.getAccountInfo(smartDelegate);
        expect(smartDelegateAccount).to.equal(null);

        // verify revoke
        const tokenAccountDataAfter = await getAccount(
          provider.connection,
          validTokenAccount,
          undefined,
          tokenProgramId,
        );
        expect(tokenAccountDataAfter.delegate).to.equal(null);
        expect(tokenAccountDataAfter.delegatedAmount.toString()).to.equal("0");
      });

      it("should not revoke token_account.delegate if it's not the smart_delegate", async () => {
        const newDelegate = Keypair.generate();
        const newDelegateAmount = BigInt(100); // arbitrary
        await approve(
          provider.connection,
          owner,
          validTokenAccount,
          newDelegate.publicKey,
          owner,
          newDelegateAmount,
          [],
          undefined,
          tokenProgramId,
        );

        const signature = await program.methods
          .closeSmartDelegate()
          .accounts({
            receiver: receiver.publicKey,
            owner: owner.publicKey,
            tokenAccount: validTokenAccount,
            smartDelegate,
            tokenProgram: tokenProgramId,
          })
          .signers([owner])
          .rpc();

        await verifyCloseSmartDelegateEvent(
          signature,
          receiver.publicKey,
          owner.publicKey,
          smartDelegate,
          validTokenAccount,
          tokenProgramId,
        );

        const tokenAccount = await getAccount(
          provider.connection,
          validTokenAccount,
          undefined,
          tokenProgramId,
        );
        assert(tokenAccount.delegate);
        expect(tokenAccount.delegate.toString()).to.equal(
          newDelegate.publicKey.toString(),
        );
        expect(tokenAccount.delegatedAmount.toString()).to.equal(
          newDelegateAmount.toString(),
        );

        // verify that the smart_delegate was still closed
        const smartDelegateAccountInfo =
          await provider.connection.getAccountInfo(smartDelegate);
        expect(smartDelegateAccountInfo).to.equal(null);
      });
    });
  });

  it("should throw an error if the owner is not the token account owner", async () => {
    const mint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      6,
      Keypair.generate(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const tokenAccount = await createAccount(
      provider.connection,
      receiver,
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
    await program.methods
      .initSmartDelegate()
      .accounts({
        payer: receiver.publicKey,
        owner: owner.publicKey,
        tokenAccount,
        smartDelegate,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([receiver, owner])
      .rpc();

    await expect(
      program.methods
        .closeSmartDelegate()
        .accounts({
          // swap receiver and owner
          receiver: owner.publicKey,
          owner: receiver.publicKey,
          tokenAccount,
          smartDelegate,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([receiver])
        .rpc(),
    ).to.eventually.be.rejectedWith(
      /AnchorError caused by account: token_account. Error Code: SmartDelegateCloseUnauthorized. Error Number: 6008. Error Message: Smart delegate can only be closed by token account owner./,
    );
  });

  it("should throw an error if the wrong token account is used", async () => {
    const mint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      6,
      Keypair.generate(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const [validTokenAccount, invalidTokenAccount] = await Promise.all([
      createAccount(
        provider.connection,
        receiver,
        mint,
        owner.publicKey,
        Keypair.generate(),
        undefined,
        TOKEN_PROGRAM_ID,
      ),
      createAccount(
        provider.connection,
        receiver,
        mint,
        owner.publicKey,
        Keypair.generate(),
        undefined,
        TOKEN_PROGRAM_ID,
      ),
    ]);
    const [smartDelegate] = deriveSmartDelegate(
      validTokenAccount,
      program.programId,
    );
    await program.methods
      .initSmartDelegate()
      .accounts({
        payer: receiver.publicKey,
        owner: owner.publicKey,
        tokenAccount: validTokenAccount,
        smartDelegate,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([receiver, owner])
      .rpc();

    // The seed error masks the custom error, hence we check for that
    await expect(
      program.methods
        .closeSmartDelegate()
        .accounts({
          receiver: receiver.publicKey,
          owner: owner.publicKey,
          tokenAccount: invalidTokenAccount,
          smartDelegate,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([owner])
        .rpc(),
    ).to.eventually.be.rejectedWith(
      /AnchorError caused by account: smart_delegate. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated./,
    );
  });
});
