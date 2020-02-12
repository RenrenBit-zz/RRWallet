import { BTCTransaction, BTCInput, BTCOutput } from "../btc/BTCTransaction";
import { BTC_SIGHASH_ALL, BTC_SIGHASH_FORKID } from "../../../../config/const";
import { serializeOutpoint, serializeOutput, getScriptCode, int2Hex, hash256 } from "../util/serialize";
import _ from "lodash";

class BCHInput extends BTCInput {
  sigHashType = BTC_SIGHASH_ALL | BTC_SIGHASH_FORKID;
}

class BCHOutput extends BTCOutput {}

class BCHTransaction extends BTCTransaction {
  hashInputs = () => {
    const hashes = this.inputs.map(input => this.bchHash(input));
    this.inputs.forEach((input, i) => {
      input.rawSigHash = hashes[i];
    });
  };
  bchHash = input => {
    const nVersion = int2Hex(this.version, 4);
    const hashPrevouts = hash256(this.inputs.map(input => serializeOutpoint(input)).join(""));
    const hashSequence = hash256(this.inputs.map(input => int2Hex(input.sequence, 4)).join(""));
    const outpoint = serializeOutpoint(input);
    const scriptCode = getScriptCode(input);
    const amount = int2Hex(input.satoshis, 8);
    const nSequence = int2Hex(input.sequence, 4);
    const hashOutputs = hash256(this.outputs.map(output => serializeOutput(output)).join(""));
    const nLocktime = int2Hex(this.locktime, 4);
    const nHashType = int2Hex(input.sigHashType, 4);
    const payload = `${nVersion}${hashPrevouts}${hashSequence}${outpoint}${scriptCode}${amount}${nSequence}${hashOutputs}${nLocktime}${nHashType}`;

    return hash256(payload);
  };
}

export { BCHTransaction, BCHInput, BCHOutput };
