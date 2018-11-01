const { runTransform } = require("../src/core");

const input = ace.edit("input", {
  mode: "ace/mode/javascript"
});
input.setTheme("ace/theme/xcode");
input.getSession().setUseWrapMode(true);

const output = ace.edit("output", {
  mode: "ace/mode/javascript",
  readOnly: true
});
output.setTheme("ace/theme/xcode");
output.getSession().setUseWrapMode(true);

let options = {};

function transform() {
  const inputValue = input.getSession().getValue();
  try {
    const outputValue = runTransform(inputValue, options);
    output.getSession().setValue(outputValue);
  } catch (err) {
    const errorMessage = err.message
      .split("\n")
      .map(s => "// " + s)
      .join("\n");
    output.getSession().setValue(errorMessage);
  }
}

let timeout = false;
input.on("input", function() {
  if (timeout) {
    clearTimeout(timeout);
  }

  timeout = setTimeout(function() {
    transform();
    timeout = false;
  }, 500);
});

const settingsButton = document.getElementById("settings");
const optionsForm = document.getElementById("options");
settingsButton.addEventListener("click", () => {
  optionsForm.classList.toggle("open");
  const isOpen = optionsForm.classList.contains("open");
  settingsButton.textContent = isOpen ? "❌ Close" : "⚙ Settings";
  if (!isOpen) {
    const data = new FormData(optionsForm);
    for (const [key, value] of data.entries()) {
      const val = parseInt(value, 10);
      options[key] = val.toString() !== "NaN" ? val : value;
    }
    transform();
  }
});

transform();
