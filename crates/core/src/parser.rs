use std::path::PathBuf;

use swc_common::comments::SingleThreadedComments;
use swc_common::{sync::Lrc, FileName, Globals, SourceMap};
use swc_ecmascript::parser::lexer::Lexer;
use swc_ecmascript::parser::{EsConfig, Parser, StringInput, Syntax, TsConfig};
use swc_ecmascript::visit::VisitMutWith;

use crate::constants::*;
use crate::decl::{ParseOptions, ParseResult};
use crate::visitor::ImportExportVisitor;

pub fn parse_code(opts: ParseOptions) -> Result<ParseResult, anyhow::Error> {
    let ParseOptions { filename, code } = opts;
    let file_info = parse_filename(&filename);
    let FileInfo {
        is_jsx,
        is_typescript,
        filename_path_buf,
        ..
    } = file_info;

    let syntax = if is_typescript {
        Syntax::Typescript(TsConfig {
            tsx: is_jsx,
            decorators: true,
            ..Default::default()
        })
    } else {
        Syntax::Es(EsConfig {
            jsx: is_jsx,
            export_default_from: true,
            ..Default::default()
        })
    };

    let source_map = Lrc::new(SourceMap::default());
    let source_file = source_map.new_source_file(
        FileName::Real(filename_path_buf.clone()),
        code.clone().into(),
    );
    let comments = SingleThreadedComments::default();

    let lexer = Lexer::new(
        syntax,
        Default::default(),
        StringInput::from(&*source_file),
        Some(&comments),
    );

    let mut parser = Parser::new_from(lexer);
    let module = parser.parse_module().expect("failed to parse module");
    swc_common::GLOBALS.set(&Globals::new(), || {
        let mut module = module;

        let mut visitor = ImportExportVisitor::new(code, source_map, source_file);
        module.visit_mut_with(&mut visitor);

        Ok(ParseResult {
            imports: visitor.imports,
            exports: visitor.exports,
            facade: visitor.facade,
            filename,
        })
    })
}

#[derive(Debug)]
pub struct FileInfo {
    pub extension: String,
    pub filename: String,
    pub filename_path_buf: PathBuf,
    pub is_jsx: bool,
    pub is_typescript: bool,
}

pub fn parse_filename(filepath: &String) -> FileInfo {
    let filename = filepath.split('/').last().unwrap();
    let extension = filename.split('.').last().unwrap();
    let is_typescript = TS_EXTS.contains(&extension);
    let is_jsx = JSX_EXTS.contains(&extension);

    let filename_path_buf = PathBuf::from(filename);

    FileInfo {
        extension: extension.to_string(),
        filename: filename.to_string(),
        is_jsx,
        is_typescript,
        filename_path_buf,
    }
}
