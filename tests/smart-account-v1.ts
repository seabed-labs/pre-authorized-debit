import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SmartAccountV1 } from "../target/types/smart_account_v1";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("smart-account-v1", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.SmartAccountV1 as Program<SmartAccountV1>;

    describe("init_smart_account_nonce", () => {
        it("initializes account correctly", async () => {
            const authorityKeypair = Keypair.generate();

            const [smartAccountNoncePubkey, smartAccountNonceBump] =
                PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("smart-account-nonce"),
                        authorityKeypair.publicKey.toBuffer(),
                    ],
                    program.programId
                );

            await program.methods
                .initSmartAccountNonce()
                .accounts({
                    payer: program.provider.publicKey,
                    authority: authorityKeypair.publicKey,
                    smartAccountNonce: smartAccountNoncePubkey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([authorityKeypair])
                .rpc();

            const smartAccountNonce =
                await program.account.smartAccountNonce.fetch(
                    smartAccountNoncePubkey
                );

            expect({
                nonce: smartAccountNonce.nonce.toString(),
                bump: smartAccountNonce.bump.toString(),
            }).to.deep.equal({
                nonce: "0",
                bump: smartAccountNonceBump.toString(),
            });
        });
    });

    describe("init_smart_account", () => {
        let smartAccountNoncePubkey: PublicKey;
        let authorityKeypair: Keypair;

        beforeEach(async () => {
            authorityKeypair = Keypair.generate();
            [smartAccountNoncePubkey] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("smart-account-nonce"),
                    authorityKeypair.publicKey.toBuffer(),
                ],
                program.programId
            );

            await program.methods
                .initSmartAccountNonce()
                .accounts({
                    payer: program.provider.publicKey,
                    authority: authorityKeypair.publicKey,
                    smartAccountNonce: smartAccountNoncePubkey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([authorityKeypair])
                .rpc();
        });

        it("initializes account correctly", async () => {
            const [smartAccountPubkey, smartAccountBump] =
                PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("smart-account"),
                        authorityKeypair.publicKey.toBuffer(),
                        Buffer.from("0"),
                    ],
                    program.programId
                );

            await program.methods
                .initSmartAccount()
                .accounts({
                    payer: program.provider.publicKey,
                    authority: authorityKeypair.publicKey,
                    smartAccountNonce: smartAccountNoncePubkey,
                    smartAccount: smartAccountPubkey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([authorityKeypair])
                .rpc();

            const smartAccount = await program.account.smartAccount.fetch(
                smartAccountPubkey
            );

            expect({
                authority: smartAccount.authority.toBase58(),
                preAuthorizationNonce:
                    smartAccount.preAuthorizationNonce.toString(),
                bump: smartAccount.bump.toString(),
            }).to.deep.equal({
                authority: authorityKeypair.publicKey.toBase58(),
                preAuthorizationNonce: "0",
                bump: smartAccountBump.toString(),
            });
        });
    });
});
