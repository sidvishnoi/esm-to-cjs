const { restorePackageJson, editPackageJson, copyFile } = require("./utils");

try {
  editPackageJson(json => {
    json.scripts = undefined;
    json.tests = undefined;
    json.devDependencies = undefined;
    json.keywords.push("gulpplugin");
    json.name = "gulp-esm-to-cjs";
    json.dependencies["esm-to-cjs"] = json.version;
  });
  copyFile("./src/gulp.js", "./index.js", str => {
    return str.replace("./core", "esm-to-cjs");
  });
} catch (err) {
  console.error(err);
  restorePackageJson();
}
