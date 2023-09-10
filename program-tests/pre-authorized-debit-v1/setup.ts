import {
  AnchorProvider,
  EventParser,
  Program,
  setProvider,
  workspace,
} from "@coral-xyz/anchor";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { PreAuthorizedDebitV1 } from "../../target/types/pre_authorized_debit_v1";

chai.use(chaiAsPromised);
setProvider(AnchorProvider.env());

export const program =
  workspace.PreAuthorizedDebitV1 as Program<PreAuthorizedDebitV1>;
export const eventParser = new EventParser(program.programId, program.coder);
export const provider = program.provider as AnchorProvider;
