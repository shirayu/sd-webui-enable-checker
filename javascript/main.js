var enableCheckerInit = function () {
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
      this.enable_checker_activate_extra_network_check =
        opts.enable_checker_activate_extra_network_check;

      this.loras = null;

      if (opts?.enable_checker_custom_color) {
        this.color_enable = opts.enable_checker_custom_color_enable;
        this.color_disable = opts.enable_checker_custom_color_disable;
        this.color_dropdown_enable =
          opts.enable_checker_custom_color_dropdown_enable;
        this.color_dropdown_disable =
          opts.enable_checker_custom_color_dropdown_disable;
        this.custom_color_zero_weihgt =
          opts.enable_checker_custom_color_zero_weihgt;
        this.color_invalid_additional_networks =
          opts.enable_checker_custom_color_invalid_additional_networks;
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
        this.color_invalid_additional_networks = "#ed9797";
      }

      this.componentId2componentIndex = {};
      for (
        let index = 0;
        index < window.gradio_config.components.length;
        index++
      ) {
        this.componentId2componentIndex[
          window.gradio_config.components[index].id
        ] = index;
        const elem_id = window.gradio_config.components[index]?.props?.elem_id;
        if (elem_id) {
          this.componentId2componentIndex[elem_id] = index;
        }
      }
    }

    getComponent(id) {
      if (id.startsWith("component-")) {
        id = Number(id.replace(/^component-/, ""));
      }

      return window.gradio_config.components[
        this.componentId2componentIndex[id]
      ];
    }
  }
  let setting = null;

  function get_script_area(suffix) {
    for (const name of ["img2img", "txt2img"]) {
      const tab = gradioApp().getElementById(`tab_${name}`);
      if (tab && tab.style.display !== "none") {
        const area = gradioApp().getElementById(`${name}${suffix}`);
        return area;
      }
    }
    return null;
  }

  function get_enable_span(component) {
    const spans = component.querySelectorAll("span");
    for (let k = 0; k < spans.length; k++) {
      const span = spans[k];
      const text = span.innerText.toLowerCase();
      if (
        text.startsWith("enable") ||
        text.endsWith("enabled") ||
        text == "active" ||
        text == "啟用" ||
        text == "启用"
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

    const accordions = controlnet_parts.querySelectorAll(
      "#txt2img_controlnet_accordions .input-accordion,#img2img_controlnet_accordions .input-accordion",
    );
    if (accordions.length > 0) {
      // WebUI Forge
      for (let k = 0; k < accordions.length; k++) {
        const accordion = accordions[k];
        const accordion_header = accordion.querySelector("div.label-wrap");
        const enable_span = accordion.querySelector("input[type=checkbox]");
        const is_active = enable_span.checked;
        change_bg(accordion_header, is_active);
        found_active_tab = found_active_tab || is_active;
      }
      return found_active_tab;
    }

    const divs = controlnet_parts
      .querySelector(".tabs")
      .querySelectorAll(":scope>div");
    if (divs == undefined || divs.length < 1) {
      return null;
    }
    const tabs = controlnet_parts
      .querySelectorAll(".tab-nav")[0]
      .querySelectorAll("button");
    if (tabs.length == 0) {
      return null;
    }
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

  function is_none(str) {
    return str.toLowerCase() === "none" || str.toLowerCase() === "nothing";
  }

  function is_target_dropdown(component) {
    let root = component;
    while (root && !root.id) {
      root = root.parentNode;
    }
    if (!root) {
      return true;
    }

    const info = setting.getComponent(root.id);

    if (info?.props?.choices) {
      if (info.props.choices.length <= 1) {
        return false;
      }
      const hasNoneOrNothing = info.props.choices.some((str) => {
        return is_none(str);
      });

      return hasNoneOrNothing;
    }
    return true;
  }

  function operate_dropdown(component) {
    if (!setting.enable_checker_activate_dropdown_check) {
      return;
    }

    const inners = component.querySelectorAll("[class*=wrap-inner]");
    for (let k = 0; k < inners.length; k++) {
      const inner = inners[k];
      const ddom = inner.querySelector("input");
      if (!is_target_dropdown(ddom)) {
        continue;
      }

      if (is_none(ddom.value)) {
        inner.style.backgroundColor = setting.color_dropdown_disable;
      } else {
        inner.style.backgroundColor = setting.color_dropdown_enable;
      }
    }
  }

  function operate_component_in_script_container(component) {
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

      //no tab (single ControlNet)
      if (is_active === null) {
        is_active = get_sibling_checkbox_status(enable_span);
      }
    } else {
      is_active = get_sibling_checkbox_status(enable_span);
    }
    change_bg(header, is_active);
  }

  function operate_component_in_accordion(component) {
    const header = get_component_header(component);
    const checkbox = header.querySelector("input[type=checkbox]");
    let is_active = checkbox.checked;
    if (is_active && header.innerText.split("\n")[0] == "Refiner") {
      const labels = component.querySelectorAll("label");
      for (let j = 0; j < labels.length; j++) {
        const label = labels[j];
        const text = label.querySelector(":scope>span").innerText;
        if (text == "Checkpoint") {
          const model = label.querySelector("input");
          if (model.value == "") {
            is_active = false;
            break;
          }
        } else if (text == "Switch at") {
          const input = component.querySelector('input[type="number"]');
          if (input.value == 1) {
            is_active = false;
            break;
          }
        }
      }
    }
    change_bg(header, is_active);
  }

  function fix_seed(ev) {
    let target;
    if (!ev.composed) {
      target = ev.target;
    } else {
      target = ev.composedPath()[0];
    }

    if (
      target?.tagName?.toLowerCase() != "a" ||
      target?.innerText != "Generate forever"
    ) {
      return;
    }

    function get_active_tab() {
      for (const name of ["img2img", "txt2img"]) {
        const tab = gradioApp().getElementById(`tab_${name}`);
        if (tab && tab.style.display !== "none") {
          return name;
        }
      }
      return null;
    }

    const active_tab = get_active_tab();
    if (active_tab === null) {
      return;
    }

    const seed_input = gradioApp()
      .getElementById(`${active_tab}_seed`)
      .querySelector("input");
    seed_input.value = -1;
    updateInput(seed_input);
  }

  function main_enable_checker(ev) {
    if (Object.keys(opts).length == 0) {
      // not ready
      return;
    }
    if (opts.enable_checker_fix_forever_randomly_seed) {
      fix_seed(ev);
    }

    if (!setting) {
      setting = new Setting();
    }

    const area_acd = get_script_area("_accordions");
    if (area_acd && opts !== undefined) {
      const components = area_acd.querySelectorAll(
        ":scope>div.input-accordion",
      );
      for (let j = 0; j < components.length; j++) {
        const component = components[j];
        operate_component_in_accordion(component);
      }
    }

    const area_sc = get_script_area("_script_container");
    if (area_sc && opts !== undefined) {
      const components = area_sc.querySelectorAll(":scope>div>div");
      for (let j = 0; j < components.length; j++) {
        const component = components[j];
        operate_component_in_script_container(component);
      }
    }
  }
  function init_network_checker(tabname, force) {
    if (
      setting === null ||
      !setting?.enable_checker_activate_extra_network_check
    ) {
      return;
    } else if (!force && setting.loras !== null) {
      return;
    }

    const name_doms = gradioApp()
      .getElementById(`${tabname}_lora_cards`)
      .querySelectorAll(".name");
    setting.loras = [];
    for (let j = 0; j < name_doms.length; j++) {
      setting.loras.push(name_doms[j].innerText);
    }
  }

  function main_network_checker(prefix) {
    if (
      setting === null ||
      !setting?.enable_checker_activate_extra_network_check
    ) {
      return;
    }
    const dom = gradioApp().querySelector(`#${prefix} > label > textarea`);
    const log_dom_id = `${prefix}_error_log`;
    let log_dom = gradioApp().getElementById(log_dom_id);
    if (!log_dom) {
      log_dom = document.createElement("div");
      log_dom.id = log_dom_id;
      dom.parentElement.parentElement.appendChild(log_dom);
    }

    const regex = /<lora:(.*?):[^>]+>/g;
    const matches = dom.value.matchAll(regex);
    const target_lora_names = Array.from(matches, (m) => m[1]);
    const notIncluded = target_lora_names.filter(
      (item) => !setting.loras.includes(item),
    );

    if (notIncluded.length == 0) {
      dom.style.background = "";
      log_dom.innerText = "";
      return;
    }
    dom.style.background = setting.color_invalid_additional_networks;
    log_dom.innerText = `Not found LoRA: ` + notIncluded.join(", ");
  }

  function check_version_for_enable_checker() {
    const versions_str =
      document.getElementsByClassName("versions")[0].innerText;
    //    console.log(versions_str);
    const items = versions_str.split(" ");
    if (items.length >= 2 && items[0] == "version:") {
      const vers = items[1].split(".");
      let err = false;

      if (vers.length < 2) {
        err = true;
      } else {
        // Support >= v1.7.0 for sd-webui
        if (vers[0].startsWith("v")) {
          const v0 = Number(vers[0].substring(1));
          if (v0 < 1 || (v0 == 1 && Number(vers[1]) < 7)) {
            err = true;
          }
        } else if (vers[0].startsWith("f")) {
          // Support >= v0.0.11 for sd-webui-forge
          const v2 = Number(vers[2].split("-")[0]);
          if (v2 < 11) {
            err = true;
          }
        } else {
          err = true;
        }
      }

      if (err) {
        const msg = `Unexpected version (${vers}) for sd-webui-enable-checker. Please try install the latest WebUI and this extension`;
        alert(msg);
        console.log(msg);
        return false;
      }
    }
    return true;
  }

  function onui_enable_checker() {
    const ok = check_version_for_enable_checker();
    if (!ok) {
      return;
    }

    ["txt2img", "img2img"].forEach((tabname) => {
      gradioApp()
        .querySelector(
          `#${tabname}_extra_refresh,#${tabname}_lora_extra_refresh_internal`,
        )
        .addEventListener("click", () => {
          init_network_checker(tabname, true);
        });

      ["prompt", "neg_prompt"].forEach((target_prompt) => {
        const prefix = `${tabname}_${target_prompt}`;
        const textarea = gradioApp().querySelector(
          `#${prefix} > label > textarea`,
        );
        textarea.addEventListener("input", () => {
          init_network_checker(tabname, false);
          main_network_checker(prefix);
        });
      });
    });
  }

  return [
    main_enable_checker,
    init_network_checker,
    main_network_checker,
    onui_enable_checker,
  ];
};

const init_enableChecker = enableCheckerInit();
const main_enable_checker = init_enableChecker[0];
const init_network_checker = init_enableChecker[1];
const main_network_checker = init_enableChecker[2];
const onui_enable_checker = init_enableChecker[3];

gradioApp().addEventListener("click", function (ev) {
  main_enable_checker(ev);
});

gradioApp().addEventListener("change", function (ev) {
  main_enable_checker(ev);
});

onUiUpdate(function (ev) {
  main_enable_checker(ev);
});

onUiLoaded(function () {
  onui_enable_checker();
});
