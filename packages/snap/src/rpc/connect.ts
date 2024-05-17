import { button, DialogType, ManageStateOperation, panel, text } from '@metamask/snaps-sdk';
import { State } from '../interfaces';


export async function connectionRequest(): Promise<string> {
  const response = await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: panel([
        text(`Hello, **${origin}**!`),
        text('This custom confirmation is just for display purposes.'),
        text(
          'But you can edit the snap source code to make it do something, if you want to!',
        ),
      ]),
    },
  });
  console.log("origin: ", origin)
  if (response === true) {
    // set state."source url" = "true"
    let state: State = await snap.request({
      method: 'snap_manageState',
      params: { operation: ManageStateOperation.GetState },
    }) as object as State;

    // if (!state) state = {};

    // if (!state.connectedUrls) state.connectedUrls = {};

    // state.connectedUrls[origin] = true;
    console.log("state\n", state);
    return "connected";
  }

  console.log("cancelled");
  return "cancelled";

}

export function isConnected(url: string): boolean {
  let state: State = snap.request({
    method: 'snap_manageState',
    params: { operation: ManageStateOperation.GetState },
  }) as object as State;

  if (!state) return false;

  // if (!state.connectedUrls) return false;

  // return state.connectedUrls[url] === true;
  return false;
}

// export async function saveUtxos(utxos: (PaymentUTXO | CoinbaseUTXO)[]): Promise<void>{
//   await resetState();
//   // get state
//   let state: UtxoStorage = await snap.request({
//     method: 'snap_manageState',
//     params: { operation: 'get' },
//   }) as object as UtxoStorage;

//   if (!state) state = {}; // Initialize state as an empty object if it's null or undefined

//   // add the utxos
//   for (let i = 0; i < utxos.length; i++) {
//     let clearAmount: string = String(utxos[i]!.amount);
//     // if utxo is coinbase, amount is clear
//     if (!isCoinbaseUTXO(utxos[i]!)) {
//       clearAmount = unmaskAmount(await userViewPriv(), utxos[i]!.rG, utxos[i]!.amount).toString();
//     }
//     // Check if `state` is initialized and if `clearAmount` key exists or is null
//     if (state[clearAmount] === undefined || state[clearAmount] === null) {
//       state[clearAmount] = JSON.stringify([]);
//     }
//     // if no element of state[clearAmount] has the same public key as utxos[i], add the utxo to the state
//     // state[clearAmount] = JSON.stringify([...JSON.parse(state[clearAmount]!), utxos[i]]);
//     // if no element of state[clearAmount] has the same public key as utxos[i], add the utxo to the state
//     if (!JSON.parse(state[clearAmount]!).some((u: PaymentUTXO | CoinbaseUTXO) => u.public_key === utxos[i]!.public_key)) {
//       state[clearAmount] = JSON.stringify([...JSON.parse(state[clearAmount]!), utxos[i]!]);
//     }
//   }

//   // save state
//   await snap.request({
//     method: 'snap_manageState',
//     params: { operation: 'update', newState: state as Record<string, Json> },
//   });
// }