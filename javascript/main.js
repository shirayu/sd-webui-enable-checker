enableCheckerInit = function () {
  function isDarkColor(color) {
    if (color.length == 0) {
      return false;
    }
    let r, g, b;

    if (color.startsWith("#")) {
      [r, g, b] = color
        .substring(1)
        .match(/.{2}/g)
        .map((c) => Number(`0x${c}`));
    } else if (color.startsWith("rgb")) {
      [r, g, b] = color.match(/\d+/g).map(Number);
    } else {
      const tempElem = document.createElement("div");
      tempElem.style.color = color;
      document.body.appendChild(tempElem);
      [r, g, b] = window
        .getComputedStyle(tempElem)
        .color.match(/\d+/g)
        .map(Number);
      document.body.removeChild(tempElem);
    }

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }

  class Setting {
    constructor() {
      this.enable_checker_activate_dropdown_check =
        opts.enable_checker_activate_dropdown_check;
      this.enable_checker_activate_weight_check =
        opts.enable_checker_activate_weight_check;
      if (opts?.enable_checker_custom_color) {
        this.color_enable = opts.enable_checker_custom_color_enable;
        this.color_disable = opts.enable_checker_custom_color_disable;
        this.color_dropdown_enable =
          opts.enable_checker_custom_color_dropdown_enable;
        this.color_dropdown_disable =
          opts.enable_checker_custom_color_dropdown_disable;
        this.custom_color_zero_weihgt =
          opts.enable_checker_custom_color_zero_weihgt;
      } else {
        if (isDarkColor(document.body.style.backgroundColor)) {
          this.color_enable = "#237366";
          this.color_disable = "#5a5757";
          this.color_dropdown_enable = "#233873";
        } else {
          this.color_enable = "skyblue";
          this.color_disable = "#aeaeae"; // light grey
          this.color_dropdown_enable = "#a4f8f1"; // light green
        }
        this.color_dropdown_disable = this.color_disable;
        this.custom_color_zero_weihgt = this.color_disable;
      }
    }
  }
  let setting = null;

  function get_script_area() {
    for (const name of ["img2img", "txt2img"]) {
      const tab = gradioApp().getElementById(`tab_${name}`);
      if (tab && tab.style.display !== "none") {
        const area = gradioApp().getElementById(`${name}_script_container`);
        return area;
      }
    }
    return null;
  }

  function get_enable_span(component) {
    const spans = component.querySelectorAll("span");
    for (let k = 0; k < spans.length; k++) {
      const span = spans[k];
      if (
        span.innerText.toLowerCase().startsWith("enable") ||
        span.innerText.toLowerCase().endsWith("enabled") ||
        span.innerText.toLowerCase() == "active"
      ) {
        return span;
      }
    }
  }

  function get_sibling_checkbox_status(node) {
    const snodes = node.parentNode.childNodes;
    for (let k = 0; k < snodes.length; k++) {
      const snode = snodes[k];
      if (snode.nodeName == "INPUT") {
        return snode.checked;
      }
    }
    return false;
  }

  function change_bg(header, is_active) {
    if (is_active) {
      header.style.backgroundColor = setting.color_enable;
    } else {
      header.style.backgroundColor = setting.color_disable;
    }
  }

  function operate_controlnet_component(controlnet_parts) {
    let found_active_tab = false;
    const divs = controlnet_parts.querySelectorAll(":scope>div>div>div");
    const tabs = divs[0].querySelectorAll(":scope>button");
    for (let k = 1; k < divs.length; k++) {
      const enable_span = get_enable_span(divs[k]);
      const is_active = get_sibling_checkbox_status(enable_span);
      change_bg(tabs[k - 1], is_active);
      found_active_tab = found_active_tab || is_active;
    }
    return found_active_tab;
  }

  function get_component_header(component) {
    return component.querySelector("div.label-wrap");
  }

  function operate_value_input(component) {
    if (!setting.enable_checker_activate_weight_check) {
      return;
    }
    const labels = component.querySelectorAll("label");
    for (let k = 0; k < labels.length; k++) {
      const labeldom = labels[k];
      const label_text = labeldom.querySelector("span")?.innerText;
      if (!label_text || !label_text.toLowerCase().includes("weight")) {
        continue;
      }
      const input = labeldom.parentNode.querySelector("input");
      if (!input) {
        continue;
      }
      if (input.value == 0) {
        input.style.backgroundColor = setting.custom_color_zero_weihgt;
      } else {
        input.style.backgroundColor = "";
      }
    }
  }

  function operate_dropdown(component) {
    if (!setting.enable_checker_activate_dropdown_check) {
      return;
    }
    const inners = component.querySelectorAll(".wrap-inner");
    for (let k = 0; k < inners.length; k++) {
      const inner = inners[k];
      const ddom = inner.querySelector(".wrap-inner span.single-select");
      if (
        ddom.innerText.toLowerCase() == "none" ||
        ddom.innerText.toLowerCase() == "nothing"
      ) {
        inner.style.backgroundColor = setting.color_dropdown_disable;
      } else {
        inner.style.backgroundColor = setting.color_dropdown_enable;
      }
    }
  }

  function operate_component(component) {
    operate_dropdown(component);
    operate_value_input(component);
    const enable_span = get_enable_span(component);
    if (!enable_span) {
      return;
    }

    const header = get_component_header(component);
    const controlnet_parts = component.querySelector("#controlnet");
    let is_active = false;
    if (controlnet_parts) {
      is_active = operate_controlnet_component(controlnet_parts);
    } else {
      is_active = get_sibling_checkbox_status(enable_span);
    }
    change_bg(header, is_active);
  }

  const visited = new Set();
  function operate_component_for_first_visit(component) {
    const header = get_component_header(component);
    function is_panel_open() {
      return header.classList.contains("open");
    }

    visited.add(component.id);
    // To check initial status, open the panel
    const icon = component.querySelector("span.icon");
    let panel_opened = false;
    if (icon && !is_panel_open()) {
      icon.click(); //Open
      panel_opened = true;
    }

    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          operate_component(component);

          if (panel_opened) {
            if (icon && is_panel_open()) {
              icon.click(); // Close
              panel_opened = false;
            } else {
              continue; // need to close but not closed
            }
          }
          observer.disconnect();
        }
      }
    });
    observer.observe(component, { childList: true, subtree: true });
  }

  function main_enable_checker() {
    const area = get_script_area();
    if (!area) {
      return;
    }

    if (!setting) {
      setting = new Setting();
    }

    const components = area.querySelectorAll(":scope>div");
    for (let j = 0; j < components.length; j++) {
      const component = components[j];

      if (visited.has(component.id)) {
        operate_component(component);
      } else {
        operate_component_for_first_visit(component);
      }
    }
  }

  return [main_enable_checker];
};

const init_enableChecker = enableCheckerInit();
const main_enable_checker = init_enableChecker[0];

gradioApp().addEventListener("click", function () {
  main_enable_checker();
});

onUiUpdate(function () {
  main_enable_checker();
});
