import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { PreAuthorizedDebitV1 } from "../../target/types/pre_authorized_debit_v1";
import {
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccount,
    createMint,
    mintTo,
} from "@solana/spl-token";

describe("pre-authorized-debit-v1#debit", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const provider = anchor.getProvider();

    const program = anchor.workspace
        .PreAuthorizedDebitV1 as anchor.Program<PreAuthorizedDebitV1>;

    let mintAuthorityKeypair: Keypair;
    let userKeypair: Keypair;
    let tokenAccountPubkey: PublicKey;
    let mintPubkey: PublicKey;

    beforeEach(async () => {
        mintAuthorityKeypair = Keypair.generate();
        userKeypair = Keypair.generate();

        const fundMintAuthorityIx = SystemProgram.transfer({
            fromPubkey: provider.publicKey!,
            toPubkey: mintAuthorityKeypair.publicKey,
            lamports: 10e9,
        });

        const tx = new Transaction();
        tx.add(fundMintAuthorityIx);

        await provider.sendAndConfirm!(tx);

        mintPubkey = await createMint(
            provider.connection,
            mintAuthorityKeypair,
            mintAuthorityKeypair.publicKey,
            null,
            6
        );

        tokenAccountPubkey = await createAssociatedTokenAccount(
            provider.connection,
            mintAuthorityKeypair,
            mintPubkey,
            userKeypair.publicKey
        );

        await mintTo(
            provider.connection,
            mintAuthorityKeypair,
            mintPubkey,
            tokenAccountPubkey,
            mintAuthorityKeypair,
            1000e6
        );

        const [smartDelegatePubkey, smartDelegateBump] =
            PublicKey.findProgramAddressSync(
                [Buffer.from("smart-delegate"), tokenAccountPubkey.toBuffer()],
                program.programId
            );

        console.log("Program ID:", program.programId.toBase58());

        await program.methods
            .initSmartDelegate()
            .accounts({
                payer: provider.publicKey!,
                owner: userKeypair.publicKey,
                tokenAccount: tokenAccountPubkey,
                smartDelegate: smartDelegatePubkey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .signers([userKeypair])
            .rpc();
    });

    it("empty test", () => {
        expect(1).to.equal(1);
    });
});
