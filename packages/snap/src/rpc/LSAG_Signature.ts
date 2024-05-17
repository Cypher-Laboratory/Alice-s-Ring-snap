import { Curve, CurveName, Point, RingSignature } from "@cypher-laboratory/alicesring-lsag";
import { State } from "../interfaces";
import { DialogType, text, panel, ManageStateOperation, heading, copyable } from "@metamask/snaps-sdk";


export async function LSAG_Signature(ring: string[], message: string, addressToUse: string, linkabilityFlag: string): Promise<string> {
  const secp256k1 = new Curve(CurveName.SECP256K1);
  const deserializedRing = ring.map((point) => Point.deserialize(point));

  // get private key from storage
  const state: State = await snap.request({
    method: 'snap_manageState',
    params: { operation: ManageStateOperation.GetState },
  }) as object as State;

  if (!state || !state.account) throw new Error('No account found');

  // get the private key from the account. else throw error
  const privateKey = state.account.find((acc) => acc.address === addressToUse)?.privateKey;
  // console.log('state:\n', state?.account);
  // console.log("str\n", JSON.stringify(state));
  // console.log("test\n", typeof (state.account[0]?.address), state.account[0]?.address);
  // console.log('privateKey:', privateKey);
  if (!privateKey) throw new Error('No private key found');

  // get the claimer receiving address:
  let address: string | undefined = undefined;

  console.log('address:', address);

  console.log('message:', message);
  const approval = await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: panel([
        heading(`Ring Sign a message:`),
        // text('Signature process can take up to 20 seconds. please wait.'),
        text('Allow this snap to sign these content using linkable ring signature?'),
        text('(masked) signer address: '),
        copyable(addressToUse),
        text('Linkability flag:'),
        copyable(linkabilityFlag),
        text('Ring size: ' + ring.length),
        text('Message:'),
        copyable(message),
      ]),
    },
  });
  console.log('approval:', approval);
  if (!approval) throw new Error('User denied signing message');
  console.log('enter signing process');
  const signature = RingSignature.sign(deserializedRing, BigInt(privateKey), message, secp256k1, linkabilityFlag, { evmCompatibility: true });
  console.log('signature:', signature.toBase64());
  return JSON.stringify(signature.toBase64());
}