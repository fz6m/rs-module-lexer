#[macro_export]
#[cfg(feature = "node")]
macro_rules! multi_env {
    ($(
        $(#[$enum_attr:meta])*
        $vis:vis enum $enum_name:ident { $($enum_content:tt)* }
    )*) => {
        $(
            #[napi_derive::napi]
            $(#[$enum_attr])*
            $vis enum $enum_name { $($enum_content)* }
        )*
    };
    ($(
        $(#[$struct_attr:meta])*
        $vis:vis struct $struct_name:ident { $($struct_content:tt)* }
    )*) => {
        $(
            #[napi_derive::napi(object)]
            $(#[$struct_attr])*
            $vis struct $struct_name { $($struct_content)* }
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
            #[serde(rename_all = "camelCase")]
            $items
        )*
    };
}

#[macro_export]
#[cfg(all(not(feature = "wasm"), not(feature = "node")))]
macro_rules! multi_env {
    ($($tokens:tt)*) => {
        $($tokens)*
    };
}
