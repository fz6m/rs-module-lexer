#[macro_export]
#[cfg(feature = "node")]
macro_rules! with_napi {
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
#[cfg(not(feature = "node"))]
macro_rules! with_napi {
    ($($tokens:tt)*) => {
        $($tokens)*
    };
}
