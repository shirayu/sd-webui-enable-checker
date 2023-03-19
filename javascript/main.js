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

function operate_component(component) {
  const enable_span = get_enable_span(component);
  if (!enable_span) {
    return;
  }

  const header = component.querySelectorAll("span.transition")[0].parentNode;
  if (get_sibling_checkbox_status(enable_span)) {
    header.style.backgroundColor = color_enable;
  } else {
    header.style.backgroundColor = color_disable;
  }
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
