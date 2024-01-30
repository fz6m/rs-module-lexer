use rayon::prelude::*;

pub mod constants;
pub mod decl;
pub mod parser;
pub mod utils;
pub mod visitor;

use decl::{IConfig, IResult, ParseResult};
use parser::parse_code;

pub fn parse(config: IConfig) -> Result<IResult, anyhow::Error> {
    let IConfig { input } = config;

    let iterator = input.par_iter();

    let output = iterator
        .map(|opts| -> Result<ParseResult, anyhow::Error> { parse_code(opts.clone()) })
        .collect::<Result<Vec<ParseResult>, anyhow::Error>>()?;

    let result = IResult { output };

    Ok(result)
}
