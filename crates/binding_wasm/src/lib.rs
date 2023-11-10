use wasm_bindgen::prelude::*;

use core::{
    decl::{IConfig, IResult},
    parse as core_parse,
};

#[wasm_bindgen]
pub fn parse(config: IConfig) -> Result<IResult, JsError> {
    core_parse(config).map_err(|err| JsError::new(&err.to_string()))
}
