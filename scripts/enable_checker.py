from modules import script_callbacks, shared

try:
    from modules import ui_components

    FormColorPicker = ui_components.FormColorPicker
except (ImportError, AttributeError):
    # for compatibility with old webui
    FormColorPicker = None


def on_ui_settings():
    section = ("enable_checker", "Enable Checker")
    shared.opts.add_option(
        "enable_checker_custom_color",
        shared.OptionInfo(False, "Use custom colors", section=section),
    )
    shared.opts.add_option(
        "enable_checker_custom_color_enable",
        shared.OptionInfo(
            "#a0d8ef",
            "Custom color of enabled scripts",
            FormColorPicker,
            section=section,
        ),
    )
    shared.opts.add_option(
        "enable_checker_custom_color_disable",
        shared.OptionInfo(
            "#aeaeae",
            "Custom color of disabled scripts",
            FormColorPicker,
            section=section,
        ),
    )


script_callbacks.on_ui_settings(on_ui_settings)
