import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { testOneTimeDebit } from "./oneTime.shared";

testOneTimeDebit(TOKEN_2022_PROGRAM_ID, "with Token2022 Program");
