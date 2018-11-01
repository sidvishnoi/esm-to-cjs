const through = require("through2");
const { runTransform } = require("./core");

const PLUGIN_NAME = "gulp-esm2cjs";

module.exports = options => {
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      this.emit(
        "error",
        new Error(PLUGIN_NAME + " => " + "Streams not supported!")
      );
      return cb(null);
    }

    try {
      const output = runTransform(file.contents.toString(), options);
      file.contents = Buffer.from(output);
      cb(null, file);
    } catch (error) {
      cb(new Error(PLUGIN_NAME + " => " + error.message));
    }
  });
};
