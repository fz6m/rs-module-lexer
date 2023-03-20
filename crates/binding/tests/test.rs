use std::fs;

use binding::parser::{ParseOptions, parse_code};

#[test]
fn test() {
    let dir = std::env::current_dir().unwrap();
    let filename = dir.join("tests").join("fixtures").join("index.tsx");
    let code = fs::read_to_string(filename.as_path()).unwrap();
    let filename_str = filename.into_os_string().into_string().unwrap();

    let res = parse_code(ParseOptions {
        filename: filename_str,
        code,
    });
    println!("{:#?}", res);
}
