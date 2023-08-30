import { AnchorProvider, setProvider } from "@coral-xyz/anchor";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
setProvider(AnchorProvider.env());
