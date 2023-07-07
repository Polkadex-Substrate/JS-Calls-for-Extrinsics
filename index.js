import { apiOptions } from "@polkadex/blockchain-api";
import { WsProvider, ApiRx, ApiPromise } from "@polkadot/api";

import { fetchBalance } from "./fetchBalance.js";
import { setExtrinsicHex } from "./decoder.js";
import { POLKADEX_TEST_CHAIN } from "./utils/constants.js";
import { printResponse } from "./writeFile.js";

const ACCOUNT_ADDRESS =
  "0x2c03000000000000000000000000000000000000000000000000000000000000000001000000";

const onConnectNativeChain = () => {
  const provider = new WsProvider(POLKADEX_TEST_CHAIN.url);

  const apiRx = new ApiRx({
    provider,
    types: apiOptions.types,
    rpc: apiOptions.rpc,
  });

  const api = new ApiPromise({
    provider,
    types: apiOptions.types,
    rpc: apiOptions.rpc,
  });

  const onReady = async () => {
    // const tx = api.tx.polkadotXcm.limitedReserveTransferAssets(
    //   { V0: { X2: ["Parent", { ParaChain: 2000 }] } },
    //   { V0: { X1: { AccountId32: { id: ADDRESS, network: "Any" } } } },
    //   {
    //     V0: {
    //       ConcreteFungible: {
    //         id: {
    //           X2: [
    //             { PalletInstance: PALLET_INSTANCE },
    //             { GeneralIndex: GENERAL_INDEX },
    //           ],
    //         },
    //         amount: AMOUNT,
    //       },
    //     },
    //   }
    // );

    console.log("Connected to blockchain....");
    const extrinsicResult = setExtrinsicHex({
      hex: ACCOUNT_ADDRESS,
      api: apiRx,
    });
    fetchBalance({
      account: ACCOUNT_ADDRESS,
      provider: apiRx?.rx,
      chain: POLKADEX_TEST_CHAIN,
    });

    // See response.json for Output
    printResponse(extrinsicResult);
  };

  const onConnectError = (error) => {
    api
      .disconnect()
      .then(() => {
        console.log("Retrying to connect with Polkadex chain"),
          setTimeout(() => onConnectNativeChain(), 5);
      })
      .catch((error) => {
        throw new Error(`onConnectNativeChain: ${error}`);
      });
  };

  api.on("ready", onReady);
  api.on("error", onConnectError);
};

onConnectNativeChain();
