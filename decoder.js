import {
  assert,
  compactToU8a,
  isHex,
  u8aConcat,
  u8aEq,
  u8aToHex,
} from "@polkadot/util";

export const setExtrinsicHex = ({ api, hex }) => {
  try {
    assert(isHex(hex), "Expected a hex-encoded call");

    let extrinsicCall;
    let extrinsicPayload = null;
    let decoded = null;
    let isCall = false;

    try {
      // cater for an extrinsic input
      const tx = api.tx(hex);

      // ensure that the full data matches here
      assert(
        tx.toHex() === hex,
        "Cannot decode data as extrinsic, length mismatch"
      );

      decoded = tx;
      extrinsicCall = api.createType("Call", decoded.method);
    } catch {
      try {
        // attempt to decode as Call
        extrinsicCall = api.createType("Call", hex);

        const callHex = extrinsicCall.toHex();

        if (callHex === hex) {
          // all good, we have a call
          isCall = true;
        } else if (hex.startsWith(callHex)) {
          // this could be an un-prefixed payload...
          const prefixed = u8aConcat(
            compactToU8a(extrinsicCall.encodedLength),
            hex
          );

          extrinsicPayload = api.createType("ExtrinsicPayload", prefixed);

          assert(
            u8aEq(extrinsicPayload.toU8a(), prefixed),
            "Unable to decode data as un-prefixed ExtrinsicPayload"
          );

          extrinsicCall = api.createType(
            "Call",
            extrinsicPayload.method.toHex()
          );
        } else {
          throw new Error(
            "Unable to decode data as Call, length mismatch in supplied data"
          );
        }
      } catch {
        // final attempt, we try this as-is as a (prefixed) payload
        extrinsicPayload = api.createType("ExtrinsicPayload", hex);

        assert(
          extrinsicPayload.toHex() === hex,
          "Unable to decode input data as Call, Extrinsic or ExtrinsicPayload"
        );

        extrinsicCall = api.createType("Call", extrinsicPayload.method.toHex());
      }
    }

    const { method, section } = api.registry.findMetaCall(
      extrinsicCall.callIndex
    );
    const extrinsicFn = api.tx[section][method];
    const extrinsicKey = extrinsicCall.callIndex.toString();

    if (!decoded) {
      decoded = extrinsicFn(...extrinsicCall.args);
    }

    //   decoded,
    //   extrinsicCall,
    //   extrinsicFn,
    //   extrinsicHex: hex,
    //   extrinsicKey,
    //   extrinsicPayload,
    //   isCall,

    const response = extract({
      isCall,
      extrinsic: decoded,
      payload: extrinsicPayload,
    });

    return response;
  } catch (e) {
    console.error(e);
    return e;
  }
};

function extract({ isCall, extrinsic, payload }) {
  if (!extrinsic) {
    return ["0x", "0x", null];
  }

  const u8a = extrinsic.method.toU8a();
  let inspect = isCall ? extrinsic.method.inspect() : extrinsic.inspect();

  if (payload) {
    const prev = inspect;

    inspect = payload.inspect();
    inspect.inner?.map((entry, index) => {
      if (index === 0) {
        // replace the method inner
        entry.inner = prev.inner;
        entry.outer = undefined;
      }

      return entry;
    });
  }

  // don't use the built-in hash, we only want to convert once
  return [u8aToHex(u8a), extrinsic.registry.hash(u8a).toHex(), inspect];
}
