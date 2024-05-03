#[macro_export]
#[cfg(all(feature = "node", not(feature = "wasm")))]
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
#[cfg(all(feature = "wasm", not(feature = "node")))]
macro_rules! multi_env {
    ($(
        $(#[$enum_attr:meta])*
        $vis:vis enum $enum_name:ident { $($enum_content:tt)* }
    )*) => {
        $(
            #[derive(tsify_next::Tsify, serde_repr::Deserialize_repr, serde_repr::Serialize_repr)]
            #[tsify(into_wasm_abi, from_wasm_abi)]
            #[repr(u8)]
            $vis enum $enum_name { $($enum_content)* }
        )*
    };
    ($(
        $(#[$struct_attr:meta])*
        $vis:vis struct $struct_name:ident { $($struct_content:tt)* }
    )*) => {
        $(
            #[derive(tsify_next::Tsify, serde::Serialize, serde::Deserialize)]
            #[tsify(into_wasm_abi, from_wasm_abi)]
            #[serde(rename_all = "camelCase")]
            $vis struct $struct_name { $($struct_content)* }
        )*
    };
}

#[macro_export]
#[cfg(any(
    all(not(feature = "wasm"), not(feature = "node")),
    all(feature = "wasm", feature = "node")
))]
macro_rules! multi_env {
    ($($tokens:tt)*) => {
        $($tokens)*
    };
}
