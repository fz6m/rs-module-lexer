use std::panic::{catch_unwind, AssertUnwindSafe};
use std::path::PathBuf;

use anyhow::{anyhow, Context};
use swc_common::{
    comments::SingleThreadedComments, errors::Handler, sync::Lrc, FileName, SourceMap, GLOBALS,
};
use swc_compiler_base::IsModule;
use swc_ecmascript::{
    ast::EsVersion,
    parser::{EsConfig, Syntax, TsConfig},
    visit::VisitMutWith,
};
use swc_error_reporters::handler::{try_with_handler, HandlerOpts};

use crate::constants::*;
use crate::decl::{ParseOptions, ParseResult};
use crate::visitor::ImportExportVisitor;

pub fn parse_code(opts: &ParseOptions) -> Result<ParseResult, anyhow::Error> {
    let ParseOptions { filename, code } = opts;
    let file_info = parse_filename(filename.as_str());
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

    try_with(source_map.clone(), false, |handler| {
        let mut module = swc_compiler_base::parse_js(
            source_map.clone(),
            source_file.clone(),
            &handler,
            EsVersion::EsNext,
            syntax,
            IsModule::Bool(true),
            Some(&comments),
        )
        .context("failed to parse code")?;

        let mut visitor = ImportExportVisitor::new(code.clone(), source_map, source_file);
        module.visit_mut_with(&mut visitor);

        Ok(ParseResult {
            filename: filename.to_owned(),
            imports: visitor.imports,
            exports: visitor.exports,
            facade: visitor.facade,
            has_module_syntax: visitor.has_module_syntax,
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

pub fn parse_filename(filepath: &str) -> FileInfo {
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

pub fn try_with<F, Ret>(
    cm: Lrc<SourceMap>,
    skip_filename: bool,
    op: F,
) -> Result<Ret, anyhow::Error>
where
    F: FnOnce(&Handler) -> Result<Ret, anyhow::Error>,
{
    GLOBALS.set(&Default::default(), || {
        try_with_handler(
            cm,
            HandlerOpts {
                skip_filename,
                ..Default::default()
            },
            |handler| {
                let result = catch_unwind(AssertUnwindSafe(|| op(handler)));

                let p = match result {
                    Ok(v) => return v,
                    Err(v) => v,
                };

                if let Some(s) = p.downcast_ref::<String>() {
                    Err(anyhow!("failed to handle: {}", s))
                } else if let Some(s) = p.downcast_ref::<&str>() {
                    Err(anyhow!("failed to handle: {}", s))
                } else {
                    Err(anyhow!("failed to handle with unknown panic message"))
                }
            },
        )
    })
}
