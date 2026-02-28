use crate::multi_env;

multi_env! {

#[derive(Debug, PartialEq)]
pub enum ImportType {
    #[doc = "
        A normal static using any syntax variations
            import .. from 'module'
    "]
    Static = 1,
    #[doc = "
        A dynamic import expression `import(specifier)` or `import(specifier, opts)`
    "]
    Dynamic = 2,
    #[doc = "
        An import.meta expression
    "]
    ImportMeta = 3,
    #[doc = "
        A source phase import 
            import source x from 'module'
    "]
    StaticSourcePhase = 4,
    #[doc = "
        A dynamic source phase import
            import.source('module')
    "]
    DynamicSourcePhase = 5,
    #[doc = "
        A static defer phase import
            import defer x from 'module'
    "]
    StaticDeferPhase = 6,
    #[doc = "
        A dynamic defer phase import
            import.defer('module')
    "]
    DynamicDeferPhase = 7,
}

}

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
    pub has_module_syntax: bool,
}

#[derive(Debug)]
pub struct ImportSpecifier {
    #[doc = " Source name "]
    pub n: Option<String>,
    #[doc = " Source start index "]
    pub s: i32,
    #[doc = " Source end index "]
    pub e: i32,
    #[doc = " Import start index "]
    pub ss: i32,
    #[doc = " Import end index "]
    pub se: i32,
    #[doc = " Dynamic import start index "]
    pub d: i32,
    #[doc = " Assert object start index (include `{}`) "]
    pub a: i32,
    #[doc = " Type of import statement "]
    pub t: ImportType,
    #[doc = " Import attributes "]
    pub at: Option<Vec<Vec<String>>>,
}

#[derive(Debug)]
pub struct ExportSpecifier {
    #[doc = " Export name "]
    pub n: String,
    #[doc = " Export origin name "]
    pub ln: Option<String>,
    #[doc = " Export name start index "]
    pub s: i32,
    #[doc = " Export name end index "]
    pub e: i32,
    #[doc = " Export origin name start index "]
    pub ls: i32,
    #[doc = " Export origin name end index "]
    pub le: i32,
}

}
