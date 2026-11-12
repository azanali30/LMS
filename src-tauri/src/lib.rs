use tauri::{Emitter, Manager};

#[tauri::command]
fn get_cli_deep_link() -> Option<String> {
  std::env::args().find(|arg| arg.starts_with("institutopropio://"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default();

  #[cfg(desktop)]
  {
    builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
      log::info!("Single instance triggered with args: {:?}", argv);
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();

        for arg in argv {
          if arg.starts_with("institutopropio://") {
            let _ = window.emit("deep-link-received", &arg);
            let js = format!(
              "if (typeof window.handleDesktopDeepLink === 'function') {{ window.handleDesktopDeepLink({:?}); }}",
              arg
            );
            let _ = window.eval(&js);
          }
        }
      }
    }));
  }

  builder = builder
    .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![get_cli_deep_link])
    .setup(|app| {
      #[cfg(desktop)]
      {
        use tauri_plugin_deep_link::DeepLinkExt;
        // Register scheme in Windows Registry (HKCU\Software\Classes\institutopropio)
        let _ = app.deep_link().register_all();

        let handle = app.handle().clone();
        app.deep_link().on_open_url(move |event| {
          if let Some(window) = handle.get_webview_window("main") {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
            for url in event.urls() {
              let url_str = url.to_string();
              let _ = window.emit("deep-link-received", &url_str);
              let js = format!(
                "if (typeof window.handleDesktopDeepLink === 'function') {{ window.handleDesktopDeepLink({:?}); }}",
                url_str
              );
              let _ = window.eval(&js);
            }
          }
        });
      }

      Ok(())
    });

  builder
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
