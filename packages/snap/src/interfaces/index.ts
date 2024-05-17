
export interface State {
  // connectedUrls?: {
  //   [url: string]: boolean;
  // };

  account?: {
    privateKey: string;
    address: string;
    mnemonic: string;
  }[];
}