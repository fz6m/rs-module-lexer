use std::cmp;

use swc_common::{sync::Lrc, SourceFile, SourceMap, Span};
use swc_ecmascript::ast;
use swc_ecmascript::visit::{VisitMut, VisitMutWith};

use crate::constants::*;
use crate::decl::{ImportSpecifier, ExportSpecifier};

pub struct ImportExportVisitor {
    pub imports: Vec<ImportSpecifier>,
    pub exports: Vec<ExportSpecifier>,
    pub facade: bool,
    pub has_module_syntax: bool,

    code_utf16: Vec<u16>,
    source_map: Lrc<SourceMap>,
    source_file: Lrc<SourceFile>,
}

impl ImportExportVisitor {
    pub fn new(code: String, source_map: Lrc<SourceMap>, source_file: Lrc<SourceFile>) -> Self {
        let code_utf16 = code.encode_utf16().collect();
        Self {
            imports: vec![],
            exports: vec![],
            facade: false,
            has_module_syntax: false,

            code_utf16,
            source_map,
            source_file,
        }
    }
}

// import
impl ImportExportVisitor {
    fn add_import(&mut self, mut import: ImportSpecifier) {
        import.se = self.forward_until_first_not_semi_idx(import.se);
        self.imports.push(import);
    }

    fn parse_import(&mut self, import: &ast::ImportDecl) {
        // import type { a } from 'b'
        // import a, { type b } from 'b'
        if import.type_only {
            return;
        }

        // import 'b'
        if import.specifiers.is_empty() {
            let name = import.src.value.to_string();
            let import_span = self.get_real_span(import.span);
            let src_span = self.get_real_span_without_quotes(import.src.span);
            let a = self.calc_assert(&import.with);
            self.add_import(ImportSpecifier {
                n: Some(name),
                s: src_span.0,
                e: src_span.1,
                ss: import_span.0,
                se: import_span.1,
                d: *NOT,
                a,
            });
            return;
        }

        // import { type c } from 'b'
        let is_all_type_import = import.specifiers.iter().all(|specifier| match specifier {
            ast::ImportSpecifier::Named(named) => named.is_type_only,
            _ => false,
        });
        if is_all_type_import {
            return;
        }

        let first_specifier = &import.specifiers[0];
        match first_specifier {
            // import a from 'bbbb'
            // import * as all from 'b'
            // import { a, b } from 'b'
            // import a, { a, b } from 'b'
            ast::ImportSpecifier::Default(_)
            | ast::ImportSpecifier::Named(_)
            | ast::ImportSpecifier::Namespace(_) => {
                let name = import.src.value.to_string();
                let src_span = self.get_real_span_without_quotes(import.src.span);
                let import_span = self.get_real_span(import.span);
                let a = self.calc_assert(&import.with);
                self.add_import(ImportSpecifier {
                    n: Some(name),
                    s: src_span.0,
                    e: src_span.1,
                    ss: import_span.0,
                    se: import_span.1,
                    d: *NOT,
                    a,
                })
            }
        }
    }
}

// export
impl ImportExportVisitor {
    fn add_export(&mut self, export: ExportSpecifier) {
        self.exports.push(export);
    }

    fn add_export_from_ident(&mut self, ident: &ast::Ident) {
        let name = ident.sym.to_string();
        let (start, end) = self.get_real_span(ident.span);
        self.add_export(ExportSpecifier {
            n: name.clone(),
            ln: Some(name),
            s: start,
            e: end,
            ls: start,
            le: end,
        })
    }

    fn parse_export_spec(&mut self, specifier: &ast::ExportSpecifier) -> bool {
        match specifier {
            ast::ExportSpecifier::Named(named) => {
                // skip type
                if named.is_type_only {
                    return false;
                }

                let start;
                let end;
                let ln_start;
                let ln_end;
                let mut is_renamed = false;
                let name = if let Some(exported) = &named.exported {
                    // export { a as b }
                    is_renamed = true;
                    match exported {
                        ast::ModuleExportName::Ident(ident) => {
                            (start, end) = self.get_real_span(ident.span);
                            ident.sym.to_string()
                        }
                        // export { 'a' as 'b' }
                        ast::ModuleExportName::Str(str) => {
                            (start, end) = self.get_real_span(str.span);
                            str.value.to_string()
                        }
                    }
                } else {
                    match &named.orig {
                        // export { a }
                        ast::ModuleExportName::Ident(ident) => {
                            (start, end) = self.get_real_span(ident.span);
                            ident.sym.to_string()
                        }
                        // export { "a" }
                        ast::ModuleExportName::Str(str) => {
                            (start, end) = self.get_real_span(str.span);
                            str.value.to_string()
                        }
                    }
                };

                let origin_name;
                if is_renamed {
                    match &named.orig {
                        ast::ModuleExportName::Ident(ident) => {
                            (ln_start, ln_end) = self.get_real_span(ident.span);
                            origin_name = Some(ident.sym.to_string());
                        }
                        // export { 'a' as 'b' }
                        ast::ModuleExportName::Str(str) => {
                            (ln_start, ln_end) = self.get_real_span(str.span);
                            origin_name = Some(str.value.to_string());
                        }
                    }
                } else {
                    (ln_start, ln_end) = (start, end);
                    origin_name = Some(name.clone());
                }

                self.add_export(ExportSpecifier {
                    n: name,
                    ln: origin_name,
                    s: start,
                    e: end,
                    ls: ln_start,
                    le: ln_end,
                });

                return true;
            }
            // export v from 'm'
            // current not support
            ast::ExportSpecifier::Default(_) => {
                return false;
            }
            // export * as a from 'b'
            ast::ExportSpecifier::Namespace(namespace) => {
                if let ast::ModuleExportName::Ident(ident) = &namespace.name {
                    let name = ident.sym.to_string();
                    let ident_span = self.get_real_span(ident.span);
                    self.add_export(ExportSpecifier {
                        n: name,
                        ln: None,
                        s: ident_span.0,
                        e: ident_span.1,
                        ls: *NOT,
                        le: *NOT,
                    });
                    return true;
                }
                return false;
            }
        }
    }

    fn parse_named_export(&mut self, export: &ast::NamedExport) -> bool {
        // export type { a } from 'b'
        // export type * as a from 'b'
        if export.type_only {
            return false;
        }

        // export { type c } from 'b'
        let is_all_type_export = export.specifiers.iter().all(|specifier| match specifier {
            ast::ExportSpecifier::Named(named) => named.is_type_only,
            _ => false,
        });
        if is_all_type_export {
            return false;
        }

        let mut is_need_add_import = false;
        for specifier in &export.specifiers {
            let need_add_import = self.parse_export_spec(specifier);
            if need_add_import && !is_need_add_import {
                is_need_add_import = true;
            }
        }
        return is_need_add_import;
    }

    fn parse_default_export_expr(&mut self, export: &ast::ExportDefaultExpr) {
        let name = DEFAULT_EXPORT.to_string();
        let export_span = self.get_real_span(export.span);
        let find_start = export_span.0 + *EXPORT_LEN;
        // find 'default' index start
        let start = self.find_code_idx_by_string(find_start, *DEFAULT_EXPORT);
        let end = start + *DEFAULT_EXPORT_LEN;
        self.add_export(ExportSpecifier {
            n: name,
            ln: None,
            s: start,
            e: end,
            ls: *NOT,
            le: *NOT,
        })
    }

    fn parse_export_decl(&mut self, export: &ast::ExportDecl) -> bool {
        let mut need_eager_return = false;
        match &export.decl {
            ast::Decl::Class(decl) => self.add_export_from_ident(&decl.ident),
            ast::Decl::Fn(decl) => self.add_export_from_ident(&decl.ident),
            ast::Decl::Var(decl) => {
                decl.decls.iter().for_each(|decl| {
                    // support export const a = 1, b = 2
                    match &decl.name {
                        ast::Pat::Ident(ident) => {
                            let name = ident.sym.to_string();
                            let (start, end) = self.get_real_span(ident.span);
                            self.add_export(ExportSpecifier {
                                n: name.clone(),
                                ln: Some(name),
                                s: start,
                                e: end,
                                ls: start,
                                le: end,
                            })
                        }
                        ast::Pat::Object(pat) => {
                            pat.props.iter().for_each(|prop| {
                                match &prop {
                                    // export const { a, b } = {}
                                    ast::ObjectPatProp::Assign(assign) => {
                                        let ident = &assign.key;
                                        let name = ident.sym.to_string();
                                        let (start, end) = self.get_real_span(ident.span);
                                        self.add_export(ExportSpecifier {
                                            n: name.clone(),
                                            ln: Some(name),
                                            s: start,
                                            e: end,
                                            ls: start,
                                            le: end,
                                        })
                                    }
                                    // TODO: Not support export const { a: b } = {}
                                    // es-module-lexer parse this case will get name:`a`, not `b`, it's a bug.
                                    ast::ObjectPatProp::KeyValue(_) => {}
                                    // Not support case: export const { a, ...b } = {}
                                    // es-module-lexer not support this case
                                    ast::ObjectPatProp::Rest(_) => {}
                                }
                            })
                        }
                        ast::Pat::Array(pat) => {
                            pat.elems.iter().for_each(|elm| {
                                if elm.is_some() {
                                    // only support export const [a, b] = []
                                    if let ast::Pat::Ident(ident) = &elm.as_ref().unwrap() {
                                        let name = ident.sym.to_string();
                                        let (start, end) = self.get_real_span(ident.span);
                                        self.add_export(ExportSpecifier {
                                            n: name.clone(),
                                            ln: Some(name),
                                            s: start,
                                            e: end,
                                            ls: start,
                                            le: end,
                                        })
                                    }
                                }
                            })
                        }
                        _ => {}
                    }
                })
            }
            ast::Decl::Using(_) => {}
            ast::Decl::TsEnum(decl) => {
                let name = decl.id.sym.to_string();
                let (start, end) = self.get_real_span(decl.id.span);
                self.add_export(ExportSpecifier {
                    n: name.clone(),
                    ln: Some(name),
                    s: start,
                    e: end,
                    ls: start,
                    le: end,
                })
            }
            ast::Decl::TsModule(decl) => {
                if let ast::TsModuleName::Ident(ident) = &decl.id {
                    let name = ident.sym.to_string();
                    let (start, end) = self.get_real_span(ident.span);
                    self.add_export(ExportSpecifier {
                        n: name.clone(),
                        ln: Some(name),
                        s: start,
                        e: end,
                        ls: start,
                        le: end,
                    })
                }
                // do not visit import / export within namespace
                need_eager_return = true;
            }
            ast::Decl::TsInterface(_) => {}
            ast::Decl::TsTypeAlias(_) => {}
        }
        need_eager_return
    }

    fn parse_export_default_decl(&mut self, export: &ast::ExportDefaultDecl) {
        let export_span = self.get_real_span(export.span);
        let find_start = export_span.0 + *EXPORT_LEN;
        let start = self.find_code_idx_by_string(find_start, *DEFAULT_EXPORT);
        let end = start + *DEFAULT_EXPORT_LEN;
        match &export.decl {
            // export default class A {}
            // export default class {}
            ast::DefaultDecl::Class(decl) => {
                if let Some(ident) = &decl.ident {
                    let origin_name = ident.sym.to_string();
                    let (origin_start, origin_end) = self.get_real_span(ident.span);
                    self.add_export(ExportSpecifier {
                        n: DEFAULT_EXPORT.to_string(),
                        ln: Some(origin_name),
                        s: start,
                        e: end,
                        ls: origin_start,
                        le: origin_end,
                    })
                } else {
                    let name = DEFAULT_EXPORT.to_string();
                    self.add_export(ExportSpecifier {
                        n: name,
                        ln: None,
                        s: start,
                        e: end,
                        ls: *NOT,
                        le: *NOT,
                    })
                }
            }
            // export default function A() {}
            // export default function() {}
            ast::DefaultDecl::Fn(decl) => {
                if let Some(ident) = &decl.ident {
                    let origin_name = ident.sym.to_string();
                    let (origin_start, origin_end) = self.get_real_span(ident.span);
                    self.add_export(ExportSpecifier {
                        n: DEFAULT_EXPORT.to_string(),
                        ln: Some(origin_name),
                        s: start,
                        e: end,
                        ls: origin_start,
                        le: origin_end,
                    })
                } else {
                    let name = DEFAULT_EXPORT.to_string();
                    self.add_export(ExportSpecifier {
                        n: name.clone(),
                        ln: None,
                        s: start,
                        e: end,
                        ls: *NOT,
                        le: *NOT,
                    })
                }
            }
            ast::DefaultDecl::TsInterfaceDecl(_) => {}
        }
    }
}

// utils
impl ImportExportVisitor {
    // legacy: imports.asserts
    fn calc_assert(&self, asserts: &Option<Box<ast::ObjectLit>>) -> i32 {
        if asserts.is_some() {
            if asserts.as_ref().is_some() {
                let real_span = self.get_real_span(asserts.as_ref().unwrap().span);
                real_span.0
            } else {
                *NOT
            }
        } else {
            *NOT
        }
    }

    fn is_whitespace_by_u16(&self, value: u16) -> bool {
        let value_utf16 = [value];
        let is_whitespace = String::from_utf16(&value_utf16);
        if is_whitespace.is_ok() {
            let is_whitespace = is_whitespace.unwrap();
            is_whitespace.trim().is_empty()
        } else {
            false
        }
    }

    fn forward_until_first_not_semi_idx(&self, end: i32) -> i32 {
        let list = &self.code_utf16;
        let right_idx = cmp::min(end as usize, list.len());
        let list_slice = &list[0..right_idx];
        for (idx, value) in list_slice.iter().rev().enumerate() {
            let is_semi = *value == *SEMI_UNICODE;
            let is_whitespace = self.is_whitespace_by_u16(*value);
            if !is_whitespace && !is_semi {
                let left_idx = right_idx - idx - 1;
                return left_idx as i32 + 1;
            }
        }
        right_idx as i32
    }

    fn get_real_span(&self, span: Span) -> (i32, i32) {
        let real_span = self.source_map.span_to_char_offset(&self.source_file, span);
        (real_span.0 as i32, real_span.1 as i32)
    }

    fn get_real_span_without_quotes(&self, span: Span) -> (i32, i32) {
        let real_span = self.get_real_span(span);
        (real_span.0 + 1, real_span.1 - 1)
    }

    fn find_code_idx_by_string(&self, find_start: i32, char: &str) -> i32 {
        let list = &self.code_utf16;
        let list_slice = &list[find_start as usize..];
        let char_utf16 = char.encode_utf16().collect::<Vec<u16>>();
        let mut idx = 0;
        while idx < list_slice.len() - char_utf16.len() + 1 {
            let mut is_match = true;
            for (char_idx, char_value) in char_utf16.iter().enumerate() {
                if list_slice[idx + char_idx] != *char_value {
                    is_match = false;
                    break;
                }
            }
            if is_match {
                return find_start + idx as i32;
            }
            idx += 1;
        }
        find_start
    }

    fn detect_facade(&mut self, module: &mut ast::Module) {
        let mut is_facade = true;
        for item in module.body.iter() {
            match item {
                ast::ModuleItem::ModuleDecl(decl) => {
                    match decl {
                        // import ...
                        ast::ModuleDecl::Import(_) => {
                            continue;
                        }
                        // e.g. export const a = 1
                        ast::ModuleDecl::ExportDecl(item) => {
                            match item.decl {
                                // export interface A {}
                                ast::Decl::TsInterface(_) => {
                                    continue;
                                }
                                // export type A = string
                                ast::Decl::TsTypeAlias(_) => {
                                    continue;
                                }
                                _ => {
                                    is_facade = false;
                                    break;
                                }
                            }
                        }
                        // e.g. export * from 'b'
                        ast::ModuleDecl::ExportNamed(_) => {
                            continue;
                        }
                        // e.g. export default a
                        ast::ModuleDecl::ExportDefaultDecl(_) => {
                            is_facade = false;
                            break;
                        }
                        // e.g. export default 1
                        ast::ModuleDecl::ExportDefaultExpr(_) => {
                            is_facade = false;
                            break;
                        }
                        // e.g. export * as a from 'b'
                        ast::ModuleDecl::ExportAll(_) => {
                            continue;
                        }
                        // e.g. import TypeScript = TypeScriptServices.TypeScript;
                        // not support
                        ast::ModuleDecl::TsImportEquals(_) => {
                            is_facade = false;
                            break;
                        }
                        // e.g. export = foo
                        // not support
                        ast::ModuleDecl::TsExportAssignment(_) => {
                            is_facade = false;
                            break;
                        }
                        // e.g. export as namespace a
                        ast::ModuleDecl::TsNamespaceExport(_) => {
                            continue;
                        }
                    }
                }
                ast::ModuleItem::Stmt(stmt) => {
                    if let ast::Stmt::Expr(expr) = stmt {
                        if let ast::Expr::Call(call) = expr.expr.as_ref() {
                            let is_dynamic_import = call.callee.is_import();
                            if is_dynamic_import {
                                if call.args.len() == 1 {
                                    if let ast::Expr::Lit(lit) = call.args[0].expr.as_ref() {
                                        if let ast::Lit::Str(_) = lit {
                                            continue;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    is_facade = false;
                    break;
                }
            }
        }
        self.facade = is_facade;
    }

    fn set_module_syntax(&mut self, value: bool) {
        self.has_module_syntax = value;
    }

    fn detect_syntax(&mut self, module: &mut ast::Module) {
        let mut has_module_syntax = false;
        for item in module.body.iter() {
            // `import` or `export`
            if let ast::ModuleItem::ModuleDecl(_) = item {
                has_module_syntax = true;
                break;
            }
        }
        self.set_module_syntax(has_module_syntax);
    }
}

// visit
impl VisitMut for ImportExportVisitor {
    fn visit_mut_module(&mut self, module: &mut ast::Module) {
        self.detect_facade(module);
        self.detect_syntax(module);
        module.visit_mut_children_with(self);
    }

    // normal
    fn visit_mut_module_decl(&mut self, decl: &mut ast::ModuleDecl) {
        match decl {
            // import
            ast::ModuleDecl::Import(import) => {
                self.parse_import(import);
            }
            // export
            // export { a , b as c }
            // export type { a } from 'b'
            // export { a, type b } from 'b'
            // export type * as all from 'b'
            ast::ModuleDecl::ExportNamed(export) => {
                let need_add_import = self.parse_named_export(export);
                if need_add_import {
                    // add import
                    if let Some(src) = &export.src {
                        let name = src.value.to_string();
                        let src_span = self.get_real_span_without_quotes(src.span);
                        let export_span = self.get_real_span(export.span);
                        let a = self.calc_assert(&export.with);
                        self.add_import(ImportSpecifier {
                            n: Some(name),
                            s: src_span.0,
                            e: src_span.1,
                            ss: export_span.0,
                            se: export_span.1,
                            d: *NOT,
                            a,
                        })
                    }
                }
            }
            // export  default   a
            // export default []
            // export default 1
            ast::ModuleDecl::ExportDefaultExpr(export) => {
                self.parse_default_export_expr(export);
            }
            // export namespace A.B {}
            // export class A {}
            // export const a = 1
            // export enum a {}
            // export function a() {}
            // export const a = 1, b = 2
            // export type A = string
            // export interface B {}
            ast::ModuleDecl::ExportDecl(export) => {
                let need_eager_return = self.parse_export_decl(export);
                if need_eager_return {
                    // skip visit children
                    return;
                }
            }
            // export * from 'vv'
            ast::ModuleDecl::ExportAll(export) => {
                // add import
                let name = export.src.value.to_string();
                let (start, end) = self.get_real_span_without_quotes(export.src.span);
                let (ss, se) = self.get_real_span(export.span);
                let a = self.calc_assert(&export.with);
                self.add_import(ImportSpecifier {
                    n: Some(name),
                    s: start,
                    e: end,
                    ss,
                    se,
                    d: *NOT,
                    a,
                });
            }
            // export default function a () {}
            ast::ModuleDecl::ExportDefaultDecl(export) => {
                self.parse_export_default_decl(export);
            }
            // export = a
            // not support
            ast::ModuleDecl::TsExportAssignment(_) => {}
            // export as namespace a
            ast::ModuleDecl::TsNamespaceExport(_) => {}
            // import TypeScript = TypeScriptServices.TypeScript;
            ast::ModuleDecl::TsImportEquals(_) => {}
        };
        decl.visit_mut_children_with(self)
    }

    // dynamic import
    fn visit_mut_expr(&mut self, node: &mut ast::Expr) {
        if let ast::Expr::Call(call) = node {
            if let ast::Callee::Import(import) = call.callee {
                let first_arg = call.args.get(0);
                if let Some(arg) = first_arg {
                    let (ss, se) = self.get_real_span(call.span);
                    let import_span = self.get_real_span(import.span);
                    let import_end = import_span.1;

                    let d = self.find_code_idx_by_string(import_end, *BRACKET_LEFT);

                    let mut name = None;
                    // offset 1 for `(`
                    let mut start = d + 1;
                    let mut end = se - 1;

                    let mut a = *NOT;
                    if let ast::Expr::Lit(lit) = arg.expr.as_ref() {
                        if let ast::Lit::Str(src) = lit {
                            name = Some(src.value.to_string());

                            // not need trim quotes
                            (start, end) = self.get_real_span(src.span);

                            // calc assert
                            let second_arg = call.args.get(1);
                            if let Some(arg) = second_arg {
                                // support object only
                                if let ast::Expr::Object(obj) = arg.expr.as_ref() {
                                    let obj_span = self.get_real_span(obj.span);
                                    a = obj_span.0;
                                }
                            }
                        }
                    }

                    self.add_import(ImportSpecifier {
                        n: name,
                        s: start,
                        e: end,
                        ss,
                        se,
                        d,
                        a,
                    })
                }
            }
        }
        node.visit_mut_children_with(self);
    }

    // import.meta.xxx
    // import.meta
    fn visit_mut_meta_prop_expr(&mut self, meta: &mut ast::MetaPropExpr) {
        let (start, end) = self.get_real_span(meta.span);
        self.add_import(ImportSpecifier {
            n: None,
            s: start,
            e: end,
            ss: start,
            se: end,
            d: *NOT_BECAUSE_META,
            a: *NOT,
        });
        // `import.meta` can only appear in module
        self.set_module_syntax(true);
        meta.visit_mut_children_with(self);
    }
}
