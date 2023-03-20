#[macro_use]
extern crate napi_derive;

#[cfg(windows)]
#[global_allocator]
static ALLOC: mimalloc::MiMalloc = mimalloc::MiMalloc;

pub mod parser;
pub mod visitor;
pub mod constants;

use parser::{parse_code, ParseOptions, ParseResult};

#[cfg(feature = "parallel")]
use rayon::prelude::*;

#[napi(object)]
pub struct IConfig {
    pub input: Vec<ParseOptions>,
}

#[napi(object)]
#[derive(Debug, Default)]
pub struct IResult {
    pub output: Vec<ParseResult>,
}

#[napi]
#[cfg(feature = "official")]
fn parse(config: IConfig) -> Result<IResult, anyhow::Error> {
    let IConfig { input } = config;

    #[cfg(feature = "parallel")]
    let iterator = input.par_iter();

    #[cfg(not(feature = "parallel"))]
    let iterator = input.iter();

    let mut output = iterator
        .map(|opts| -> Result<ParseResult, anyhow::Error> { parse_code(opts.clone()) })
        .collect::<Result<Vec<ParseResult>, anyhow::Error>>()?;

    output.sort_by(|a, b| a.filename.cmp(&b.filename));

    let result = IResult { output };

    Ok(result)
}
