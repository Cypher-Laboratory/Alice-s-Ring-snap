import { DialogType, text, panel, ManageStateOperation, heading, copyable, Json } from "@metamask/snaps-sdk";
import { State } from "../interfaces";
import { ethers } from "ethers";


export async function getNewAccount() {
  const response = await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: panel([
        heading(`Add account`),
        text('You are going to generate a new account. Please manually copy the seed phrase on a physical support and keep it safe.'),
      ]),
    },
  });

  if (response === true) {

    const account = generateAccount();

    await snap.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Alert,
        content: panel([
          heading(`Add account`),
          text('Here is your new account seed phrase:'),
          copyable(account.mnemonic),
          text('Here is your new account address:'),
          copyable(account.address),
          text(
            '**This seed phrase key should be kept secret. Please write it down on a paper and avoid any electronic way to save it**',
          ),
        ]),
      },
    });

    // save account to state
    let state: State = await snap.request({
      method: 'snap_manageState',
      params: { operation: ManageStateOperation.GetState },
    }) as object as State;

    if (!state) state = {};

    if (!state.account) state.account = [];

    state.account.push({
      privateKey: account.privateKey,
      address: account.address,
      mnemonic: account.mnemonic,
    });

    await snap.request({
      method: 'snap_manageState',
      params: { operation: ManageStateOperation.UpdateState, newState: state as Record<string, Json> },
    });
    
    return account.address;
  }

  return "cancelled";
}

export async function importAccount() {
  const seedOrPrivateKey = await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Prompt,
      content: panel([
        heading('Import account'),
        text(`Enter your mnemonic here:`),
      ]),
    },
  });

  let account = {
    privateKey: '',
    mnemonic: '',
    address: ''
  }
  // console.log("seed:\n", seedOrPrivateKey?.toString());

  try {
    if (seedOrPrivateKey?.toString().startsWith('0x')) {
      // console.log("private key: ", seedOrPrivateKey);
      const retrievedAccount = new ethers.Wallet(seedOrPrivateKey.toString());
      // console.log("retrievedAccount:\n", retrievedAccount);
      account.privateKey = retrievedAccount.privateKey;
      // console.log("account0:\n", account);
      account.address = retrievedAccount.address;
      // console.log("account1:\n", account);
      account.mnemonic = ''; // todo: fix retrievedAccount.mnemonic.phrase;
      throw new Error("Not implemented yet");
    } else {
      // console.log("mnemonic");
      const retrievedAccount = ethers.Wallet.fromMnemonic(seedOrPrivateKey!.toString());
      account.privateKey = retrievedAccount.privateKey;
      account.address = retrievedAccount.address;
      account.mnemonic = seedOrPrivateKey!.toString();
    }
  } catch (e) {
    return await snap.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Alert,
        content: panel([
          heading('Import account'),
          text(`Your mnemonic is invalid`),
          copyable(seedOrPrivateKey?.toString()),
        ]),
      },
    });
  }

  // check if account already exists
  let state: State = await snap.request({
    method: 'snap_manageState',
    params: { operation: ManageStateOperation.GetState },
  }) as object as State;

  if (!state) state = {};

  if (!state.account) state.account = [];
  const existingAccount = state.account.find((acc) => acc.address === account.address);
  // console.log("state:\n", state);

  if (existingAccount) {
    return await snap.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Alert,
        content: panel([
          heading('Import account'),
          text(`Account already exists`),
        ]),
      },
    });
  }

  // save account to state
  state.account.push({
    privateKey: account.privateKey,
    address: account.address,
    mnemonic: account.mnemonic,
  });

  await snap.request({
    method: 'snap_manageState',
    params: { operation: ManageStateOperation.UpdateState, newState: state as Record<string, Json> },
  });

  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Alert,
      content: panel([
        heading('Import account'),
        text(`Account added successfully`),
      ]),
    },
  });
}

function generateAccount() {
  const account = ethers.Wallet.createRandom();
  return {
    privateKey: account.privateKey,
    mnemonic: account.mnemonic.phrase,
    address: account.address
  }
}


export async function exportAccount(address: string) {
  // get mnemonic from state
  const state: State = await snap.request({
    method: 'snap_manageState',
    params: { operation: ManageStateOperation.GetState },
  }) as object as State;
  console.log("state:\n", state?.account);
  if (!state || !state.account) {
    return await snap.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Alert,
        content: panel([
          heading('Export account'),
          text(`No account found`),
        ]),
      },
    });
  };

  const approval = await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: panel([
        heading('Export account'),
        text(`Exported account:`),
        copyable(address),
        text('Are you sure you want to export this account?'),
        text('**Be careful when exporting your mnemonic. Anyone with access to it can access your account and all your funds**'),
      ]),
    },
  });

  if (approval) {
    const account = state.account.find((acc) => acc.address === address);

    if (!account) {
      return await snap.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Alert,
          content: panel([
            heading('Export account'),
            text(`Account not found`),
          ]),
        },
      });
    }

    await snap.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Alert,
        content: panel([
          heading('Export account'),
          text(`Exported account:`),
          copyable(address),
          text('Here is your mnemonic:'),
          copyable(ethers.Wallet.fromMnemonic(account.mnemonic).mnemonic.phrase),
        ]),
      },
    });
  }

  return "cancelled";
}



export async function getAddresses() {
  const state: State = await snap.request({
    method: 'snap_manageState',
    params: { operation: ManageStateOperation.GetState },
  }) as object as State;


  if (!state || !state.account) {
    return await snap.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Alert,
        content: panel([
          heading('Get addresses'),
          text(`No account found`),
        ]),
      },
    });
  };

  const addresses = state.account.map((acc) => acc.address);

  if (addresses.length === 0) {
    return await snap.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Alert,
        content: panel([
          heading('Get addresses'),
          text(`No account found`),
        ]),
      },
    });
  }

  const copyableAddresses = addresses.map((address) => copyable(address));

  const approval = await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: panel([
        heading(`Get addresses:`),
        text('Allow this snap to access all your addresses?'),
        ...copyableAddresses
      ]),
    },
  });


  if (approval) {
    return JSON.stringify({ addresses: addresses });
  }

  return JSON.stringify({ addresses: [] });
}