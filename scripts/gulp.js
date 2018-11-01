const { restorePackageJson, editPackageJson, copyFile } = require("./utils");

try {
  editPackageJson(json => {
    json.scripts = undefined;
    json.tests = undefined;
    json.devDependencies = undefined;
    json.keywords.push("gulpplugin");
    json.name = "gulp-esm2cjs";
  });
  copyFile("./src/gulp.js", "./index.js", str => {
    return str.replace("./core", "esm2cjs");
  });
} catch (err) {
  console.error(err);
  restorePackageJson();
}
