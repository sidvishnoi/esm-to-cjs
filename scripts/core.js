const { restorePackageJson, editPackageJson, copyFile } = require("./utils");

try {
  editPackageJson(json => {
    json.scripts = undefined;
    json.tests = undefined;
    json.dependencies = undefined;
    json.devDependencies = undefined;
  });
  copyFile("./src/core.js", "./index.js");
} catch (err) {
  console.error(err);
  restorePackageJson();
}
