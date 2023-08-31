import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { testRecurringDebit } from "./recurring.shared";

testRecurringDebit(TOKEN_2022_PROGRAM_ID, "with Token2022 Program");
