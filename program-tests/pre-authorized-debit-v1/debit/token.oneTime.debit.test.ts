import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { testOneTimeDebit } from "./oneTime.shared";

testOneTimeDebit(TOKEN_PROGRAM_ID, "with Token Program");
