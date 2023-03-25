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

let color_enable = null;
let color_disable = null;

function set_color() {
  if (color_enable !== null) {
    return;
  }
  if (isDarkColor(document.body.style.backgroundColor)) {
    color_enable = "#237366";
    color_disable = "#5a5757";
  } else {
    color_enable = "skyblue";
    color_disable = "#aeaeae"; // light grey
  }
}

function change_bg(header, is_active) {
  set_color();

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
  for (let k = 1; k < divs.length; k++) {
    const enable_span = get_enable_span(divs[k]);
    const is_active = get_sibling_checkbox_status(enable_span);
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

onUiUpdate(function () {
  main()
});
