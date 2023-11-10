use std::fs;

use core::{parse, IConfig, parser::ParseOptions};

#[test]
fn test() {
    let dir = std::env::current_dir().unwrap();
    let filename = dir.join("tests").join("fixtures").join("index.tsx");
    let code = fs::read_to_string(filename.as_path()).unwrap();
    let filename_str = filename.into_os_string().into_string().unwrap();

    let parse_opts = ParseOptions {
        filename: filename_str,
        code,
    };
    let res = parse(IConfig {
        input: vec![
            parse_opts
        ]
    });
    println!("{:#?}", res.unwrap().output[0]);
}
