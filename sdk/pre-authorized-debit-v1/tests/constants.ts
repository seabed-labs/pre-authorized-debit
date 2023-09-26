import dotenv from "dotenv";
import { clusterApiUrl } from "@solana/web3.js";
dotenv.config();

export const localValidatorUrl = "http://127.0.0.1:8899";
export const mainnetValidatorUrl =
  process.env.MAINNET_VALIDATOR_URL ?? clusterApiUrl("mainnet-beta");
export const devnetValidatorUrl =
  process.env.DEVNET_VALIDATOR_URL ?? clusterApiUrl("devnet");
