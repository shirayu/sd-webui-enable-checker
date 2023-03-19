const color_enable = "skyblue";
const color_disable = "grey";

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
      span.innerText.toLowerCase().endsWith("enabled")
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
    header.style.backgroundColor = color_enable;
  } else {
    header.style.backgroundColor = color_disable;
  }
}

function operate_controlnet_component(controlnet_parts) {
  let found_active_tab = false;
  const divs = controlnet_parts.querySelectorAll(":scope>div>div>div");
  const tabs = divs[0].querySelectorAll(":scope>button");
  console.log("@@", divs, tabs);
  for (let k = 1; k < divs.length; k++) {
    const enable_span = get_enable_span(divs[k]);
    const is_active = get_sibling_checkbox_status(enable_span);
    console.log(k, is_active, enable_span, divs, tabs[k - 1]);
    change_bg(tabs[k - 1], is_active);
    found_active_tab = found_active_tab || is_active;
  }
  return found_active_tab;
}

function operate_component(component) {
  const enable_span = get_enable_span(component);
  if (!enable_span) {
    return;
  }

  const header = component.querySelectorAll("span.transition")[0].parentNode;
  const controlnet_parts = component.querySelector("#controlnet");
  let is_active = false;
  if (controlnet_parts) {
    is_active = operate_controlnet_component(controlnet_parts);
  } else {
    is_active = get_sibling_checkbox_status(enable_span);
  }
  change_bg(header, is_active);
}

function main() {
  const area = get_script_area();
  if (!area) {
    return;
  }

  const components = area.querySelectorAll(":scope>div");
  for (let j = 0; j < components.length; j++) {
    const component = components[j];
    operate_component(component);
  }
}

gradioApp().addEventListener("click", function (ev) {
  main();
});
setTimeout(main, 500);
