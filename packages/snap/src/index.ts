import { OnRpcRequestHandler, UnauthorizedError } from '@metamask/snaps-sdk';
import { exportAccount, getAddresses, getNewAccount, importAccount } from './rpc/account';
import { LSAG_Signature } from './rpc/LSAG_Signature';
import { PAC_LSAG_Signature } from './rpc/PAC_LSAG_Signature';
import { getKeyImages } from './rpc/getKeyImages';
import { SAG_Signature } from './rpc/SAG_Signature';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {

  switch (request.method) {
    case 'newAccount':
      return await getNewAccount() as any; // as any, else 'onRpcRequest' is marked as error

    case 'importAccount':
      return await importAccount();

    case 'exportAccount':
      const address = (request.params as { address: string }).address;
      if (!address) throw new UnauthorizedError('Valid address is required');
      return await exportAccount(address);

    case 'getAddresses':
      return await getAddresses();

    case 'SAG_Signature': {
      const { ring, message, addressToUse } = (request.params as { ring: string[], message: string, addressToUse: string });
      return await SAG_Signature(ring, message, addressToUse);
    }

    case 'LSAG_Signature': {
      const { ring, message, addressToUse, linkabilityFlag } = (request.params as { ring: string[], message: string, addressToUse: string, linkabilityFlag: string });
      return await LSAG_Signature(ring, message, addressToUse, linkabilityFlag);
    }

    case 'PrivateAirdropClaim_LSAG_Signature':
      const payload = (request.params as { ring: string[], claim_contract_address: string, addressToUse: string, airdropTier: string, chainId: string });
      return await PAC_LSAG_Signature(payload.ring, payload.claim_contract_address, payload.addressToUse, payload.airdropTier, payload.chainId);

    case 'ExportKeyImages':
      const { addresses, linkabilityFactor } = (request.params as { addresses: string[], linkabilityFactor: string });
      return await getKeyImages(addresses, linkabilityFactor);

    default:
      throw new Error('Method not found.');
  }
};
