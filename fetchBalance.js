export const fetchBalance = ({ account, provider, chain }) => {
  provider?.query?.system
    ?.account(account)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .subscribe((data) => {
      console.log("Here is the balance details => ", {
        free: data.data.free.toString(),
        reserved: data.data.reserved.toString(),
        ticker: chain?.token_ticker ?? "",
        decimals: chain?.token_decimals ?? 1,
        asset_id: chain?.token_asset_id ?? "",
        icon_id: chain?.icon_id ?? "",
      });
    });
};
