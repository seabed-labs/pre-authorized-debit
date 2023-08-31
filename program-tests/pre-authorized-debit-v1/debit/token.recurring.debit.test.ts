import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { testRecurringDebit } from "./recurring.shared";

testRecurringDebit(TOKEN_PROGRAM_ID, "with Token Program");
