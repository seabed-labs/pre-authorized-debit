import {
  AnchorProvider,
  BN,
  Program,
  ProgramAccount,
  utils,
} from "@coral-xyz/anchor";
import {
  Connection,
  GetProgramAccountsFilter,
  Keypair,
  Message,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  CheckDebitAmountParams,
  CheckDebitAmountResult,
  PDA,
  PreAuthorizationType,
  PreAuthorizedDebitReadClient,
} from "../interface";
import { DEVNET_PAD_PROGRAM_ID, MAINNET_PAD_PROGRAM_ID } from "../../constants";
import {
  IdlNotFoundOnChainError,
  NoPreAuthorizationFound,
  TokenAccountDoesNotExist,
} from "../../errors";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PreAuthorizationAccount, SmartDelegateAccount } from "../accounts";
import {
  Account,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { IDL, PreAuthorizedDebitV1 } from "../../pre_authorized_debit_v1";

export class PreAuthorizedDebitReadClientImpl
  implements PreAuthorizedDebitReadClient
{
  private readonly program: Program<PreAuthorizedDebitV1>;

  // eslint-disable-next-line no-useless-constructor
  private constructor(
    private readonly connection: Connection,
    private readonly programId: PublicKey,
  ) {
    const readonlyProvider = new AnchorProvider(
      this.connection,
      new NodeWallet(Keypair.generate()),
      { commitment: this.connection.commitment },
    );

    this.program = new Program(IDL, this.programId, readonlyProvider);
  }

  public static custom(
    connection: Connection,
    programId: PublicKey,
  ): PreAuthorizedDebitReadClient {
    return new PreAuthorizedDebitReadClientImpl(connection, programId);
  }

  public static mainnet(connection: Connection): PreAuthorizedDebitReadClient {
    return PreAuthorizedDebitReadClientImpl.custom(
      connection,
      MAINNET_PAD_PROGRAM_ID,
    );
  }

  public static devnet(connection: Connection): PreAuthorizedDebitReadClient {
    return PreAuthorizedDebitReadClientImpl.custom(
      connection,
      DEVNET_PAD_PROGRAM_ID,
    );
  }

  public async fetchIdlFromChain(): Promise<PreAuthorizedDebitV1> {
    const idl = await Program.fetchIdl<PreAuthorizedDebitV1>(this.programId, {
      connection: this.connection,
    });

    if (!idl) {
      throw new IdlNotFoundOnChainError(
        this.connection.rpcEndpoint,
        this.programId,
      );
    }

    return idl;
  }

  public getSmartDelegatePDA(): PDA {
    const [pdaPubkey, pdaBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("smart-delegate")],
      this.programId,
    );

    return { publicKey: pdaPubkey, bump: pdaBump };
  }

  public derivePreAuthorizationPDA(
    tokenAccount: PublicKey,
    debitAuthority: PublicKey,
  ): PDA {
    const [pdaPubkey, pdaBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pre-authorization"),
        tokenAccount.toBuffer(),
        debitAuthority.toBuffer(),
      ],
      this.programId,
    );

    return {
      publicKey: pdaPubkey,
      bump: pdaBump,
    };
  }

  private smartDelegateToNativeType(
    smartDelegateAnchorType: Awaited<
      ReturnType<typeof this.program.account.smartDelegate.fetch>
    >,
  ): SmartDelegateAccount {
    return {
      bump: smartDelegateAnchorType.bump,
    };
  }

  private preAuthorizationToNativeType(
    preAuthorizationAnchorType: Awaited<
      ReturnType<typeof this.program.account.preAuthorization.fetch>
    >,
  ): PreAuthorizationAccount {
    let variant: PreAuthorizationAccount["variant"];
    if (preAuthorizationAnchorType.variant.oneTime) {
      const oneTimeVariant = preAuthorizationAnchorType.variant.oneTime;

      variant = {
        type: "oneTime",
        amountAuthorized: BigInt(oneTimeVariant.amountAuthorized.toString()),
        amountDebited: BigInt(oneTimeVariant.amountDebited.toString()),
        expiryUnixTimestamp: BigInt(
          oneTimeVariant.expiryUnixTimestamp.toString(),
        ),
      };
    } else {
      const recurringVariant = preAuthorizationAnchorType.variant.recurring;
      const numCycles = recurringVariant.numCycles;

      variant = {
        type: "recurring",
        recurringAmountAuthorized: BigInt(
          recurringVariant.recurringAmountAuthorized.toString(),
        ),
        repeatFrequencySeconds: BigInt(
          recurringVariant.repeatFrequencySeconds.toString(),
        ),
        resetEveryCycle: recurringVariant.resetEveryCycle,
        amountDebitedTotal: BigInt(
          recurringVariant.amountDebitedTotal.toString(),
        ),
        amountDebitedLastCycle: BigInt(
          recurringVariant.amountDebitedLastCycle.toString(),
        ),
        lastDebitedCycle: BigInt(recurringVariant.lastDebitedCycle.toString()),
        numCycles: numCycles && BigInt(numCycles.toString()),
      };
    }

    return {
      bump: preAuthorizationAnchorType.bump,
      tokenAccount: preAuthorizationAnchorType.tokenAccount,
      debitAuthority: preAuthorizationAnchorType.debitAuthority,
      activationUnixTimestamp: BigInt(
        preAuthorizationAnchorType.activationUnixTimestamp.toString(),
      ),
      paused: preAuthorizationAnchorType.paused,
      variant,
    };
  }

  public async fetchSmartDelegate(): Promise<ProgramAccount<SmartDelegateAccount> | null> {
    const { publicKey: smartDelegtePubkey } = this.getSmartDelegatePDA();

    const smartDelegateAccount =
      await this.program.account.smartDelegate.fetchNullable(
        smartDelegtePubkey,
      );

    return (
      smartDelegateAccount && {
        publicKey: smartDelegtePubkey,
        account: this.smartDelegateToNativeType(smartDelegateAccount),
      }
    );
  }

  public async fetchPreAuthorization(
    params:
      | { publicKey: PublicKey }
      | { tokenAccount: PublicKey; debitAuthority: PublicKey },
  ): Promise<ProgramAccount<PreAuthorizationAccount> | null> {
    const maybePublicKeyParam = params as Partial<
      Extract<typeof params, { publicKey: PublicKey }>
    >;

    const maybeComponentParams = params as Exclude<
      typeof params,
      typeof maybePublicKeyParam
    >;

    const preAuthorizationPubkey =
      maybePublicKeyParam.publicKey ??
      this.derivePreAuthorizationPDA(
        maybeComponentParams.tokenAccount,
        maybeComponentParams.debitAuthority,
      ).publicKey;

    const preAuthorizationAccount =
      await this.program.account.preAuthorization.fetchNullable(
        preAuthorizationPubkey,
      );

    return (
      preAuthorizationAccount && {
        publicKey: preAuthorizationPubkey,
        account: this.preAuthorizationToNativeType(preAuthorizationAccount),
      }
    );
  }

  private async fetchPreAuthorizations(
    type: PreAuthorizationType,
    filterBy: {
      tokenAccount?: PublicKey;
      debitAuthority?: PublicKey;
    },
  ): Promise<ProgramAccount<PreAuthorizationAccount>[]> {
    const filters: GetProgramAccountsFilter[] = [];

    if (filterBy.tokenAccount) {
      filters.push({
        // tokenAccount
        memcmp: {
          offset: 10,
          bytes: filterBy.tokenAccount.toBase58(),
        },
      });
    }

    if (filterBy.debitAuthority) {
      filters.push({
        // debitAuthority
        memcmp: {
          offset: type === "recurring" ? 93 : 67,
          bytes: filterBy.debitAuthority.toBase58(),
        },
      });
    }

    if (type === "oneTime") {
      filters.push({
        // PreAuthorizationVariant::OneTime (discriminator)
        memcmp: {
          offset: 42,
          bytes: utils.bytes.bs58.encode(Buffer.from([0])),
        },
      });
    } else if (type === "recurring") {
      filters.push({
        // PreAuthorizationVariant::Recurring (discriminator)
        memcmp: {
          offset: 42,
          bytes: utils.bytes.bs58.encode(Buffer.from([1])),
        },
      });
    }
    const programAccounts =
      await this.program.account.preAuthorization.all(filters);

    return programAccounts.map((programAccount) => ({
      publicKey: programAccount.publicKey,
      account: this.preAuthorizationToNativeType(programAccount.account),
    }));
  }

  public async fetchPreAuthorizationsForTokenAccount(
    tokenAccount: PublicKey,
    type: PreAuthorizationType = "all",
  ): Promise<ProgramAccount<PreAuthorizationAccount>[]> {
    return this.fetchPreAuthorizations(type, { tokenAccount });
  }

  public async fetchPreAuthorizationsForDebitAuthority(
    debitAuthority: PublicKey,
    type: PreAuthorizationType = "all",
  ): Promise<ProgramAccount<PreAuthorizationAccount>[]> {
    if (type === "all") {
      return [
        ...(await this.fetchPreAuthorizations("oneTime", { debitAuthority })),
        ...(await this.fetchPreAuthorizations("recurring", { debitAuthority })),
      ];
    }
    return this.fetchPreAuthorizations(type, { debitAuthority });
  }

  public async checkDebitAmount(
    params: CheckDebitAmountParams,
  ): Promise<CheckDebitAmountResult> {
    const { txFeePayer } = params;
    let tokenAccountPubkey: PublicKey,
      debitAuthorityPubkey: PublicKey,
      preAuthorizationPubkey: PublicKey;

    if ("preAuthorization" in params) {
      const preAuthorizationAccount = await this.fetchPreAuthorization({
        publicKey: params.preAuthorization,
      });
      if (preAuthorizationAccount === null) {
        return {
          successful: false,
          reason: ["Pre-authorization account not found on-chain"],
        };
      }
      tokenAccountPubkey = preAuthorizationAccount.account.tokenAccount;
      debitAuthorityPubkey = preAuthorizationAccount.account.debitAuthority;
      preAuthorizationPubkey = params.preAuthorization;
    } else {
      const preAuthorizationAccount = await this.fetchPreAuthorization({
        tokenAccount: params.tokenAccount,
        debitAuthority: params.debitAuthority,
      });
      if (preAuthorizationAccount === null) {
        return {
          successful: false,
          reason: ["Pre-authorization account not found on-chain"],
        };
      }
      tokenAccountPubkey = params.tokenAccount;
      debitAuthorityPubkey = params.debitAuthority;
      preAuthorizationPubkey = preAuthorizationAccount.publicKey;
    }

    const tokenAccountInfo =
      await this.connection.getAccountInfo(tokenAccountPubkey);

    const tokenProgramId = tokenAccountInfo?.owner;

    if (
      tokenAccountInfo == null ||
      tokenProgramId == null || // for typescript
      ![TOKEN_PROGRAM_ID.toString(), TOKEN_2022_PROGRAM_ID.toString()].includes(
        tokenProgramId.toString(),
      )
    ) {
      throw new TokenAccountDoesNotExist(
        this.connection.rpcEndpoint,
        tokenAccountPubkey,
      );
    }

    const tokenAccount = await getAccount(
      this.connection,
      tokenAccountPubkey,
      this.connection.commitment,
      tokenProgramId,
    );

    const destinationTokenAccount =
      params.destinationTokenAccount ??
      getAssociatedTokenAddressSync(
        tokenAccount.mint,
        debitAuthorityPubkey,
        true,
        tokenProgramId,
      );

    const { publicKey: smartDelegate } = this.getSmartDelegatePDA();

    const tx = await this.program.methods
      .debit({
        amount: new BN(params.requestedDebitAmount.toString()),
      })
      .accounts({
        debitAuthority: debitAuthorityPubkey,
        mint: tokenAccount.mint,
        tokenAccount: tokenAccountPubkey,
        destinationTokenAccount,
        smartDelegate,
        preAuthorization: preAuthorizationPubkey,
        tokenProgram: tokenProgramId,
      })
      .transaction();

    const latestBlockhash = await this.connection.getLatestBlockhash();

    const message = Message.compile({
      payerKey: txFeePayer,
      instructions: tx.instructions,
      recentBlockhash: latestBlockhash.blockhash,
    });

    const versionedTx = new VersionedTransaction(message);

    const res = await this.connection.simulateTransaction(versionedTx, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });

    const isSimulationSuccessful = res.value.err === null;

    if (isSimulationSuccessful) {
      return { successful: true, reason: undefined };
    }

    return {
      successful: false,
      reason: res.value.logs
        ? ["simulation failed; logs:", ...res.value.logs]
        : ["simulation failed"],
    };
  }

  public async fetchMaxDebitAmount(params: {
    tokenAccount: PublicKey;
    debitAuthority: PublicKey;
  }): Promise<bigint> {
    const { tokenAccount, debitAuthority } = params;
    const preAuthorization = await this.fetchPreAuthorization({
      tokenAccount,
      debitAuthority,
    });

    if (!preAuthorization) {
      throw NoPreAuthorizationFound.givenTokenAccountAndDebitAuthority(
        this.connection.rpcEndpoint,
        tokenAccount,
        debitAuthority,
      );
    }

    if (preAuthorization.account.paused) {
      return BigInt(0);
    }

    const activationUnixTimestamp = Number(
      preAuthorization.account.activationUnixTimestamp,
    );

    const activationDate = new Date(activationUnixTimestamp * 1e3);
    const solanaNowDate = new Date((await this.getSolanaUnixTimestamp()) * 1e3);
    if (activationDate > solanaNowDate) {
      return BigInt(0);
    }

    const variant = preAuthorization.account.variant;

    if (variant.type === "oneTime") {
      const { amountAuthorized, amountDebited, expiryUnixTimestamp } = variant;
      const expiryDate = new Date(Number(expiryUnixTimestamp) * 1e3);

      if (solanaNowDate >= expiryDate) {
        return BigInt(0);
      }

      if (amountAuthorized <= amountDebited) {
        return BigInt(0);
      }

      return amountAuthorized - amountDebited;
    } else {
      const {
        recurringAmountAuthorized,
        repeatFrequencySeconds,
        numCycles,
        resetEveryCycle,
        amountDebitedLastCycle,
        amountDebitedTotal,
        lastDebitedCycle,
      } = variant;

      const secondsSinceActivation =
        Math.floor(solanaNowDate.getTime() / 1e3) -
        Math.floor(activationDate.getTime() / 1e3);

      const currentCycle =
        1 + Number(BigInt(secondsSinceActivation) / repeatFrequencySeconds);

      if (numCycles != null && currentCycle > numCycles) {
        return BigInt(0);
      }

      if (!resetEveryCycle) {
        return (
          recurringAmountAuthorized * BigInt(currentCycle) - amountDebitedTotal
        );
      }

      if (lastDebitedCycle === BigInt(currentCycle)) {
        return recurringAmountAuthorized - amountDebitedLastCycle;
      }

      return recurringAmountAuthorized;
    }
  }

  public async fetchCurrentOwnerOfTokenAccount(
    tokenAccountPubkey: PublicKey,
  ): Promise<PublicKey> {
    const tokenProgramId =
      await this.fetchTokenProgramIdForTokenAccount(tokenAccountPubkey);
    let tokenAccount: Account;

    try {
      tokenAccount = await getAccount(
        this.connection,
        tokenAccountPubkey,
        this.connection.commitment,
        tokenProgramId,
      );
    } catch {
      throw new TokenAccountDoesNotExist(
        this.connection.rpcEndpoint,
        tokenAccountPubkey,
      );
    }

    return tokenAccount.owner;
  }

  public async fetchCurrentOwnerOfPreAuthTokenAccount(
    preAuthorizationPubkey: PublicKey,
  ): Promise<PublicKey> {
    const preAuthorization = await this.fetchPreAuthorization({
      publicKey: preAuthorizationPubkey,
    });

    if (!preAuthorization) {
      throw NoPreAuthorizationFound.givenPubkey(
        this.connection.rpcEndpoint,
        preAuthorizationPubkey,
      );
    }

    return this.fetchCurrentOwnerOfTokenAccount(
      preAuthorization.account.tokenAccount,
    );
  }

  public async fetchTokenProgramIdForTokenAccount(
    tokenAccountPubkey: PublicKey,
  ): Promise<PublicKey> {
    const tokenAccountInfo =
      await this.connection.getAccountInfo(tokenAccountPubkey);

    if (!this.isOwnerTokenProgram(tokenAccountInfo)) {
      throw new TokenAccountDoesNotExist(
        this.connection.rpcEndpoint,
        tokenAccountPubkey,
      );
    }

    return tokenAccountInfo.owner;
  }

  public async fetchCurrentDelegationOfTokenAccount(
    tokenAccountPubkey: PublicKey,
  ): Promise<{ delegate: PublicKey; delegatedAmount: bigint } | null> {
    const tokenProgramId =
      await this.fetchTokenProgramIdForTokenAccount(tokenAccountPubkey);

    let tokenAccount: Account;

    try {
      tokenAccount = await getAccount(
        this.connection,
        tokenAccountPubkey,
        this.connection.commitment,
        tokenProgramId,
      );
    } catch {
      throw new TokenAccountDoesNotExist(
        this.connection.rpcEndpoint,
        tokenAccountPubkey,
      );
    }

    return tokenAccount.delegate && tokenAccount.delegatedAmount > BigInt(0)
      ? {
          delegate: tokenAccount.delegate,
          delegatedAmount: tokenAccount.delegatedAmount,
        }
      : null;
  }

  public async fetchCurrentDelegationOfPreAuthTokenAccount(
    preAuthorizationPubkey: PublicKey,
  ): Promise<{ delegate: PublicKey; delegatedAmount: bigint } | null> {
    const preAuthorization = await this.fetchPreAuthorization({
      publicKey: preAuthorizationPubkey,
    });

    if (!preAuthorization) {
      throw NoPreAuthorizationFound.givenPubkey(
        this.connection.rpcEndpoint,
        preAuthorizationPubkey,
      );
    }

    return this.fetchCurrentDelegationOfTokenAccount(
      preAuthorization.account.tokenAccount,
    );
  }

  private isOwnerTokenProgram<T extends { owner: PublicKey }>(
    account: T | undefined | null,
  ): account is T {
    if (!account) {
      return false;
    }
    return [
      TOKEN_PROGRAM_ID.toString(),
      TOKEN_2022_PROGRAM_ID.toString(),
    ].includes(account.owner.toString());
  }

  private async getSolanaUnixTimestamp(): Promise<number> {
    const latestSlot = await this.connection.getSlot();
    const latestSlotUnixTimestamp =
      await this.connection.getBlockTime(latestSlot);
    return latestSlotUnixTimestamp || Math.floor(new Date().getTime() / 1e3); // fallback to client side current timestamp
  }
}
