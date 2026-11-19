// Compile the existing, platform-independent curriculum for the Functions runtime.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const source = path.resolve(__dirname, "../../src");
const output = path.join(__dirname, "curriculum");
const entries = [
  "data/readingLessons", "data/readingQuizzes", "data/mathLessons", "data/mathQuizzes",
  "data/writingLessons", "data/writingStrokeTemplates", "data/mascotShop", "data/phygitalWorksheets",
  "services/writing/tracingValidator", "services/phygital/worksheetLayout",
  "utils/ruleEngine", "utils/assessmentAttempt", "utils/xp",
];
const built = new Set();

function compile(entry) {
  const file = path.resolve(source, entry + ".ts");
  if (built.has(file)) return;
  built.add(file);
  if (!file.startsWith(source + path.sep)) throw new Error("Unexpected curriculum source path.");
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace(/require\("([^"]+)"\)/g, (expression, dependency) => {
    if (/\.(png|jpeg|jpg|webp|mp3|wav|m4a)$/i.test(dependency)) return "null";
    if (!dependency.startsWith(".")) throw new Error("Unexpected curriculum dependency " + dependency);
    compile(path.relative(source, path.resolve(path.dirname(file), dependency)));
    return expression;
  });
  const destination = path.join(output, path.relative(source, file)).replace(/\.ts$/, ".js");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, code);
}

entries.forEach(compile);
