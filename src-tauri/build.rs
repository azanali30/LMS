use std::path::PathBuf;

fn main() {
  let attrs = tauri_build::Attributes::new()
    .windows_attributes(
      tauri_build::WindowsAttributes::new()
        .window_icon_path(PathBuf::from("icons/icon.ico"))
    );

  tauri_build::try_build(attrs).expect("failed to run tauri-build");
}
