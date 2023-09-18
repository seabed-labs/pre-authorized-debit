import { Keypair } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import providerKeypair from "./fixtures/provider-keypair.json";

export function getProviderNodeWallet(): NodeWallet {
  const secretKey = Uint8Array.from(providerKeypair);
  const walletKeypair = Keypair.fromSecretKey(secretKey);
  return new NodeWallet(walletKeypair);
}
