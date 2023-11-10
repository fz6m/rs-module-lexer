use crate::multi_env;

multi_env! {

#[derive(Debug, Clone)]
pub struct IConfig {
    pub input: Vec<ParseOptions>,
}

#[derive(Debug, Default)]
pub struct IResult {
    pub output: Vec<ParseResult>,
}

#[derive(Debug, Clone)]
pub struct ParseOptions {
    pub filename: String,
    pub code: String,
}

#[derive(Debug)]
pub struct ParseResult {
    pub filename: String,
    pub imports: Vec<ImportSpecifier>,
    pub exports: Vec<ExportSpecifier>,
    pub facade: bool,
}

#[derive(Debug)]
pub struct ImportSpecifier {
    /// source name
    pub n: Option<String>,
    /// source start index
    pub s: i32,
    /// source end index
    pub e: i32,
    /// import start index
    pub ss: i32,
    /// import end index
    pub se: i32,
    /// dynamic import start index
    pub d: i32,
    /// assert object start index (include `{}`)
    pub a: i32,
}

#[derive(Debug)]
pub struct ExportSpecifier {
    /// export name
    pub n: String,
    /// export origin name
    pub ln: Option<String>,
    /// export name start index
    pub s: i32,
    /// export name end index
    pub e: i32,
    /// export origin name start index
    pub ls: i32,
    /// export origin name end index
    pub le: i32,
}

}
