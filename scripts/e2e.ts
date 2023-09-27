import {
  InstructionFactoryImpl,
  PreAuthorizedDebitReadClientImpl,
  TransactionFactoryImpl,
} from "@seabed-labs/pre-authorized-debit";
import { Cluster, Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";
import assert from "assert";
import bs58 from "bs58";
import dotenv from "dotenv";
dotenv.config();

const CLUSTER: Cluster = "devnet";

async function main() {
  console.log("Running pad-test:main");
  const payerPrivateKey = process.env.PAYER_PRIVATE_KEY!;
  const payerKeypair = Keypair.fromSecretKey(bs58.decode(payerPrivateKey));
  console.log("Cluster:", CLUSTER);
  console.log("Payer:", payerKeypair.publicKey.toBase58());
  const connection = new Connection(clusterApiUrl(CLUSTER), "confirmed");
  const readClient = PreAuthorizedDebitReadClientImpl.devnet(connection);
  const ixFactory = InstructionFactoryImpl.devnet(connection);
  const txFactory = TransactionFactoryImpl.devnet(connection);

  console.log();
  console.log("Fetching Smart Delegate");
  const smartDelegate = await readClient.fetchSmartDelegate();
  assert(smartDelegate);
  console.log("Smart Delegate:", serialize(smartDelegate));

  console.log();
  const userKeypair = Keypair.generate();
  console.log("User:", userKeypair.publicKey.toBase58());

  console.log();
  console.log("Creating Test Mint");
  const testMint = await createMint(
    connection,
    payerKeypair,
    payerKeypair.publicKey,
    null,
    6,
    undefined,
  );
  console.log("Test Mint:", testMint.toBase58());

  console.log();
  console.log(
    `Creating Token Account for user (${userKeypair.publicKey.toBase58()})`,
  );
  const userTokenAccount = await createAssociatedTokenAccount(
    connection,
    payerKeypair,
    testMint,
    userKeypair.publicKey,
    undefined,
    TOKEN_PROGRAM_ID,
  );
  console.log("Token Account:", userTokenAccount.toBase58());

  await mintTo(
    connection,
    payerKeypair,
    testMint,
    userTokenAccount,
    payerKeypair,
    BigInt(100_000e6),
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
  );

  const ownerOfTokenAccount =
    await readClient.fetchCurrentOwnerOfTokenAccount(userTokenAccount);
  assert(ownerOfTokenAccount.equals(userKeypair.publicKey));

  const debitAuthorityKeypairs = [
    Keypair.generate(),
    Keypair.generate(),
    Keypair.generate(),
    Keypair.generate(),
  ];

  let i = 0;
  for (const debitAuthorityKeypair of debitAuthorityKeypairs) {
    console.log();
    const shouldInitOneTimePreAuth = i % 2 == 0;
    i++;
    const tx = shouldInitOneTimePreAuth
      ? await txFactory.buildInitOneTimePreAuthorizationTx({
          payer: payerKeypair.publicKey,
          tokenAccount: userTokenAccount,
          debitAuthority: debitAuthorityKeypair.publicKey,
          activation: new Date(new Date().getTime() - 1 * 3600 * 1e3), // -1h from now
          amountAuthorized: BigInt(1000e6),
        })
      : await txFactory.buildInitRecurringPreAuthorizationTx({
          payer: payerKeypair.publicKey,
          tokenAccount: userTokenAccount,
          debitAuthority: debitAuthorityKeypair.publicKey,
          activation: new Date(new Date().getTime() - 1 * 3600 * 1e3), // -1h from now
          repeatFrequencySeconds: BigInt(24 * 60 * 60), // 1h
          recurringAmountAuthorized: BigInt(100e6),
          numCycles: BigInt(10),
          resetEveryCycle: true,
        });

    const txRes = await tx.execute({
      signers: [payerKeypair, userKeypair],
    });

    console.log("Init Pre Auth TX:", serialize(txRes));
  }

  console.log();
  const preAuthorizationsForTokenAccount =
    await readClient.fetchPreAuthorizationsForTokenAccount(userTokenAccount);
  console.log(
    `Pre-Authorizations for token account (${userTokenAccount.toBase58()}):`,
    serialize(preAuthorizationsForTokenAccount),
  );

  for (const debitAuthorityKeypair of debitAuthorityKeypairs) {
    const preAuthorizationsForDebitAuthority =
      await readClient.fetchPreAuthorizationsForDebitAuthority(
        debitAuthorityKeypair.publicKey,
      );

    console.log(
      `Pre-Authorizations for debit authority (${debitAuthorityKeypair.publicKey.toBase58()}):`,
      serialize(preAuthorizationsForDebitAuthority),
    );
  }

  console.log();
  const userTokenAccountDelegation =
    await readClient.fetchCurrentDelegationOfPreAuthTokenAccount(
      preAuthorizationsForTokenAccount[0].publicKey,
    );
  console.log(
    "User Token Account Delegation (from pre-auth):",
    serialize(userTokenAccountDelegation),
  );

  const destinationTokenAccount = await createAssociatedTokenAccount(
    connection,
    payerKeypair,
    testMint,
    debitAuthorityKeypairs[0].publicKey,
    undefined,
    TOKEN_PROGRAM_ID,
  );

  console.log();
  const maxDebitParams = {
    tokenAccount: userTokenAccount,
    debitAuthority: debitAuthorityKeypairs[0].publicKey,
  };
  const maxDebitAmount = await readClient.fetchMaxDebitAmount(maxDebitParams);
  console.log(
    "Max Debit Amount:",
    serialize({
      params: maxDebitParams,
      result: maxDebitAmount,
    }),
  );

  const checkDebitTooMuchParams = {
    ...maxDebitParams,
    requestedDebitAmount: BigInt(1000e6 + 1),
    txFeePayer: payerKeypair.publicKey,
  };
  const checkDebitTooMuchResult = await readClient.checkDebitAmount(
    checkDebitTooMuchParams,
  );
  console.log(
    "Check Debit (too much):",
    serialize({
      params: checkDebitTooMuchParams,
      result: checkDebitTooMuchResult,
    }),
  );

  const checkDebitBelowMaxParams = {
    ...maxDebitParams,
    requestedDebitAmount: BigInt(100),
    txFeePayer: payerKeypair.publicKey,
  };
  const preAuthToDebit = readClient.derivePreAuthorizationPDA(
    maxDebitParams.tokenAccount,
    maxDebitParams.debitAuthority,
  );
  const checkDebitBelowMaxResult = await readClient.checkDebitAmount({
    preAuthorization: preAuthToDebit.publicKey,
    requestedDebitAmount: BigInt(100),
    txFeePayer: payerKeypair.publicKey,
  });
  console.log(
    "Check Debit (below max):",
    serialize({
      params: checkDebitBelowMaxParams,
      result: checkDebitBelowMaxResult,
    }),
  );

  const debitTx = await txFactory.buildDebitTx({
    preAuthorization: preAuthToDebit.publicKey,
    amount: BigInt(100),
    destinationTokenAccount,
  });

  const simResult = await debitTx.simulate({
    txFeesPayer: payerKeypair.publicKey,
    simulateConfig: { sigVerify: false },
  });
  console.log();
  console.log("Debit Simulation Result:", serialize(simResult));
}

function serialize(account: any) {
  return JSON.stringify(
    account,
    (_, v) => {
      if (typeof v === "bigint") {
        return v.toString();
      }

      return v;
    },
    2,
  );
}

if (require.main === module) {
  main();
}
