use wasm_bindgen::prelude::*;

use core::{
    decl::{IConfig, IResult},
    parse as core_parse,
};

#[wasm_bindgen]
pub fn parse(config: IConfig) -> Result<IResult, JsError> {
    core_parse(config).map_err(|err| JsError::new(&err.to_string()))
}

#[wasm_bindgen(typescript_custom_section)]
const INTERFACE_DEFINITIONS: &'static str = r#"
export function parseAsync(config: IConfig): Promise<IResult>;
"#;

#[wasm_bindgen(js_name = "parseAsync", skip_typescript)]
pub fn parse_async(config: IConfig) -> js_sys::Promise {
    wasm_bindgen_futures::future_to_promise(async {
        core_parse(config)
            .map(|r| serde_wasm_bindgen::to_value(&r).unwrap())
            .map_err(|err| JsValue::from_str(&err.to_string()))
    })
}
