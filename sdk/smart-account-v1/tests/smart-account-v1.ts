import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { createMint } from "@solana/spl-token";
import { SmartAccountV1 } from "../target/types/smart_account_v1";
import {
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
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

        it("initializes account correctly and increments nonce", async () => {
            const smartAccountNonceBefore =
                await program.account.smartAccountNonce.fetch(
                    smartAccountNoncePubkey
                );

            expect(smartAccountNonceBefore.nonce.toString()).to.equal("0");

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

            const smartAccountNonceAfter =
                await program.account.smartAccountNonce.fetch(
                    smartAccountNoncePubkey
                );

            expect(smartAccountNonceAfter.nonce.toString()).to.equal("1");

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

    describe("init_one_time_pre_authorization", () => {
        let smartAccountNoncePubkey: PublicKey;
        let smartAccountPubkey: PublicKey;
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

            [smartAccountPubkey] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("smart-account"),
                    authorityKeypair.publicKey.toBuffer(),
                    Buffer.from("0"),
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
        });

        it("initializes account correctly and increments nonce", async () => {
            const mintAuthorityKeypair = Keypair.generate();

            const tx = new Transaction();
            tx.add(
                SystemProgram.transfer({
                    fromPubkey: program.provider.publicKey,
                    toPubkey: mintAuthorityKeypair.publicKey,
                    lamports: 1e9,
                })
            );

            await program.provider.sendAndConfirm(tx);

            const mint = await createMint(
                program.provider.connection,
                mintAuthorityKeypair,
                mintAuthorityKeypair.publicKey,
                mintAuthorityKeypair.publicKey,
                6
            );

            const debitAuthorityPubkey = PublicKey.unique();

            const [preAuthorizationPubkey, preAuthorizationBump] =
                PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("pre-authorization"),
                        smartAccountPubkey.toBuffer(),
                        Buffer.from("0"),
                    ],
                    program.programId
                );

            const smartAccountBefore = await program.account.smartAccount.fetch(
                smartAccountPubkey
            );

            expect(
                smartAccountBefore.preAuthorizationNonce.toString()
            ).to.equal("0");

            const activationUnixTimestamp = new anchor.BN(
                Math.floor(new Date().getTime() / 1e3) + 10 * 24 * 60 * 60 // now + 10 days
            );

            await program.methods
                .initOneTimePreAuthorization({
                    debitAuthority: debitAuthorityPubkey,
                    activationUnixTimestamp,
                    variant: {
                        oneTime: {
                            amountAuthorized: new anchor.BN(1000),
                        },
                    },
                })
                .accounts({
                    payer: program.provider.publicKey,
                    authority: authorityKeypair.publicKey,
                    smartAccount: smartAccountPubkey,
                    mint,
                    preAuthorization: preAuthorizationPubkey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([authorityKeypair])
                .rpc();

            const smartAccountAfter = await program.account.smartAccount.fetch(
                smartAccountPubkey
            );

            expect(smartAccountAfter.preAuthorizationNonce.toString()).to.equal(
                "1"
            );

            const preAuthorization =
                await program.account.preAuthorization.fetch(
                    preAuthorizationPubkey
                );

            expect(preAuthorization.bump).to.equal(preAuthorizationBump);
            expect(
                preAuthorization.activationUnixTimestamp.toString()
            ).to.equal(activationUnixTimestamp.toString());
            expect(preAuthorization.amountDebited.toString()).to.equal("0");
            expect(preAuthorization.mint.toBase58()).to.equal(mint.toBase58());
            expect(preAuthorization.debitAuthority.toBase58()).to.equal(
                debitAuthorityPubkey.toBase58()
            );
            expect(preAuthorization.smartAccount.toBase58()).to.equal(
                smartAccountPubkey.toBase58()
            );
            expect(
                preAuthorization.variant.oneTime.amountAuthorized.toString()
            ).to.equal("1000");
        });
    });

    describe("cancel_pre_authorization", () => {
        let smartAccountNoncePubkey: PublicKey;
        let smartAccountPubkey: PublicKey;
        let authorityKeypair: Keypair;
        let preAuthorizationPubkey: PublicKey;

        beforeEach(async () => {
            authorityKeypair = Keypair.generate();
            [smartAccountNoncePubkey] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("smart-account-nonce"),
                    authorityKeypair.publicKey.toBuffer(),
                ],
                program.programId
            );

            [smartAccountPubkey] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("smart-account"),
                    authorityKeypair.publicKey.toBuffer(),
                    Buffer.from("0"),
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

            const mintAuthorityKeypair = Keypair.generate();

            const tx = new Transaction();
            tx.add(
                SystemProgram.transfer({
                    fromPubkey: program.provider.publicKey,
                    toPubkey: mintAuthorityKeypair.publicKey,
                    lamports: 1e9,
                })
            );

            tx.add(
                SystemProgram.transfer({
                    fromPubkey: program.provider.publicKey,
                    toPubkey: authorityKeypair.publicKey,
                    lamports: 1e9,
                })
            );

            await program.provider.sendAndConfirm(tx);

            const mint = await createMint(
                program.provider.connection,
                mintAuthorityKeypair,
                mintAuthorityKeypair.publicKey,
                mintAuthorityKeypair.publicKey,
                6
            );

            const debitAuthorityPubkey = PublicKey.unique();

            [preAuthorizationPubkey] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("pre-authorization"),
                    smartAccountPubkey.toBuffer(),
                    Buffer.from("0"),
                ],
                program.programId
            );

            const activationUnixTimestamp = new anchor.BN(
                Math.floor(new Date().getTime() / 1e3) + 10 * 24 * 60 * 60 // now + 10 days
            );

            await program.methods
                .initOneTimePreAuthorization({
                    debitAuthority: debitAuthorityPubkey,
                    activationUnixTimestamp,
                    variant: {
                        oneTime: {
                            amountAuthorized: new anchor.BN(1000),
                        },
                    },
                })
                .accounts({
                    payer: program.provider.publicKey,
                    authority: authorityKeypair.publicKey,
                    smartAccount: smartAccountPubkey,
                    mint,
                    preAuthorization: preAuthorizationPubkey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([authorityKeypair])
                .rpc();
        });

        it("closes account and refunds to authority", async () => {
            const preAuthorization =
                await program.account.preAuthorization.getAccountInfo(
                    preAuthorizationPubkey
                );

            const lamportsToRefund = preAuthorization.lamports;
            const authorityBefore =
                await program.provider.connection.getAccountInfo(
                    authorityKeypair.publicKey
                );

            await program.methods
                .cancelPreAuthorization()
                .accounts({
                    signer: authorityKeypair.publicKey,
                    authority: authorityKeypair.publicKey,
                    smartAccount: smartAccountPubkey,
                    preAuthorization: preAuthorizationPubkey,
                })
                .signers([authorityKeypair])
                .rpc();

            const authorityAfter =
                await program.provider.connection.getAccountInfo(
                    authorityKeypair.publicKey
                );

            expect(authorityAfter.lamports - authorityBefore.lamports).to.equal(
                lamportsToRefund
            );
        });
    });
});
