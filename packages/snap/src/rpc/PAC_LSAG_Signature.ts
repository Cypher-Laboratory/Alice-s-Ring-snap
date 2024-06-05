import { Curve, CurveName, Point, RingSignature } from "@cypher-laboratory/alicesring-lsag";
import { State } from "../interfaces";
import { DialogType, text, panel, ManageStateOperation, heading, copyable } from "@metamask/snaps-sdk";


export async function PAC_LSAG_Signature(ring: string[], claim_contract_address: string, addressToUse: string): Promise<string> {
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
  let previousIsFalse = false;
  let isInRing = false;
  do {

    const displayedPanel = previousIsFalse ? [
      heading('Claimer Address'),
      text('**The last address you entered is invalid. Please enter a valid address**'),
      isInRing ? text('**The claimer address cannot be in the ring**') : text(''),
      text('Enter the address you will use to claim the reward:'),
    ] : [
      heading('Claimer Address'),
      isInRing ? text('**The claimer address cannot be in the ring**') : text(''),
      text('Enter the address you will use to claim the reward:')
    ]

    address = (await snap.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Prompt,
        content: panel(
          displayedPanel
        ),
      },
    }))?.toString();

    if (address === undefined) throw new Error('User cancelled the lsag signature process');

    if (!address || !/^(0x)?[0-9a-fA-F]{40}$/.test(address as string)) previousIsFalse = true;

    // check if the receiving address is in the ring
    if (address && ring.find((point) => Point.deserialize(point).toEthAddress() === address!.toLowerCase() || addressToUse.toLowerCase() === address!.toLowerCase())) {
      isInRing = true;
    }

    // check if the address is a valid hex string with 42 characters. if it is not, ask the user to enter a valid address
  } while (!address || !/^(0x)?[0-9a-fA-F]{40}$/.test(address as string) || isInRing);


  console.log('address:', address);
  const message = JSON.stringify({
    claimContractAddress: claim_contract_address,
    claimerAddress: address,
  });
  console.log('message:', message);
  const approval = await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: panel([
        heading(`Ring Sign a message:`),
        // text('Signature process can take up to 20 seconds. please wait.'),
        text('Allow this snap to sign these content?'),
        text('Claim contract address: '),
        copyable(claim_contract_address),
        text('Claimer address: '),
        copyable(address as string),
        text('Ring size: ' + ring.length),
        text('Message:'),
        copyable(message),
      ]),
    },
  });
  // console.log('approval:', approval);
  if (!approval) throw new Error('User denied signing message');
  console.log('enter signing process');
  const signature = RingSignature.sign(deserializedRing, BigInt(privateKey), message, secp256k1, claim_contract_address);
  console.log('signature:', signature.toBase64());
  return JSON.stringify(signature.toBase64());
}