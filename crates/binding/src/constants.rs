use lazy_static::lazy_static;

lazy_static! {
    pub static ref TS_EXTS: Vec<&'static str> = vec!["ts", "tsx", "mts", "cts", "mtsx", "ctsx"];
    pub static ref JSX_EXTS: Vec<&'static str> = vec!["tsx", "jsx", "mtsx", "ctsx", "mjsx", "cjsx"];
    pub static ref NOT: i32 = -1;
    pub static ref NOT_BECAUSE_META: i32 = -2;
    pub static ref DEFAULT_EXPORT: &'static str = "default";
    pub static ref DEFAULT_EXPORT_LEN: i32 = 7;
    pub static ref BRACKET_LEFT: &'static str = "(";
    pub static ref SEMI: &'static str = ";";
    pub static ref SEMI_UNICODE: u16 = SEMI.encode_utf16().next().unwrap();
    pub static ref EXPORT_LEN: i32 = 6;
}
