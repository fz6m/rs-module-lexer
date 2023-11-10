#[macro_export]
#[cfg(feature = "node")]
macro_rules! multi_env {
    ($(
        $items:item
    )*) => {
        use napi_derive::napi;
        $(
            #[napi(object)]
            $items
        )*
    };
}

#[macro_export]
#[cfg(feature = "wasm")]
macro_rules! multi_env {
    ($(
        $items:item
    )*) => {
        use tsify::Tsify;
        use serde::{Deserialize, Serialize};
        use wasm_bindgen::prelude::*;
        $(
            #[derive(Tsify, Serialize, Deserialize)]
            #[tsify(into_wasm_abi, from_wasm_abi)]
            $items
        )*
    };
}

#[macro_export]
#[cfg(all(not(feature = "wasm"), not(feature = "node"),))]
macro_rules! multi_env {
    ($($tokens:tt)*) => {
        $($tokens)*
    };
}
