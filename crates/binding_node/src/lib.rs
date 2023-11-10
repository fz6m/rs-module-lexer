use core::{
    decl::{IConfig, IResult},
    parse as core_parse,
};

#[cfg(all(
    not(all(target_os = "linux", target_env = "musl", target_arch = "aarch64")),
    not(debug_assertions)
))]
#[global_allocator]
static ALLOC: mimalloc_rust::GlobalMiMalloc = mimalloc_rust::GlobalMiMalloc;

#[macro_use]
extern crate napi_derive;

#[napi]
pub fn parse(config: IConfig) -> Result<IResult, anyhow::Error> {
    core_parse(config)
}

static TARGET_TRIPLE: &str = include_str!(concat!(env!("OUT_DIR"), "/triple.txt"));

#[napi]
pub fn get_target_triple() -> napi::Result<String> {
    Ok(TARGET_TRIPLE.to_string())
}