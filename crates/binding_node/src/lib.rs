use napi::{bindgen_prelude::AsyncTask, Env, Task};
use core::{
    decl::{IConfig, IResult},
    parse as core_parse,
};

#[cfg(all(
    not(all(target_os = "linux", target_env = "musl", target_arch = "aarch64")),
    not(debug_assertions)
))]
#[global_allocator]
static ALLOC: mimalloc_rust::GlobalMiMalloc = mimalloc_rust::GlobalMiMalloc;

#[macro_use]
extern crate napi_derive;

#[napi]
pub fn parse(config: IConfig) -> Result<IResult, anyhow::Error> {
    core_parse(config)
}

pub struct TaskExecutor {
    config: IConfig,
}

pub struct ParseTask {
    task: TaskExecutor,
}

impl TaskExecutor {
    pub fn parse(&self) -> Result<IResult, anyhow::Error> {
        core_parse(self.config.clone())
    }
}

impl Task for ParseTask {
    type Output = IResult;
    type JsValue = IResult;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        self.task.parse().map_err(|err| napi::Error::from_reason(&err.to_string()))
    }

    fn resolve(&mut self, _env: Env, output: Self::Output) -> napi::Result<Self::JsValue> {
        Ok(output)
    }
}

#[napi(ts_return_type="Promise<IResult>")]
pub fn parse_async(config: IConfig) -> AsyncTask<ParseTask> {
    AsyncTask::new(ParseTask {
        task: TaskExecutor { config },
    })
}

static TARGET_TRIPLE: &str = include_str!(concat!(env!("OUT_DIR"), "/triple.txt"));

#[napi]
pub fn get_target_triple() -> napi::Result<String> {
    Ok(TARGET_TRIPLE.to_string())
}