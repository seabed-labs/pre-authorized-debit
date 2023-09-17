import dotenv from "dotenv";
dotenv.config();

export const localValidatorUrl = "http://127.0.0.1:8899";

export const mainnetValidatorUrl = process.env.MAINNET_VALIDATOR_URL!;
export const devnetValidatorUrl = process.env.DEVNET_VALIDATOR_URL!;
