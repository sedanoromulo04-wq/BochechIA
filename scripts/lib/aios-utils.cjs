const fs = require("fs");
const path = require("path");
const yaml = require(path.join(
  __dirname,
  "..",
  "..",
  "dashboard",
  "node_modules",
  "js-yaml",
));

const ROOT = path.resolve(__dirname, "..", "..");
const SQUADS_ROOT = path.join(ROOT, "squads");
const CORE_ROOT = path.join(ROOT, "core");
const ROUTING_PATH = path.join(CORE_ROOT, "routing", "model-routing.yaml");

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readYaml(filePath) {
  return yaml.load(readFile(filePath));
}

function listTopLevelSquadDirs() {
  return fs
    .readdirSync(SQUADS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => ({
      id: entry.name,
      path: path.join(SQUADS_ROOT, entry.name),
    }))
    .filter((entry) => fs.existsSync(path.join(entry.path, "squad.yaml")));
}

function parseMarkdownFrontmatter(filePath) {
  const raw = readFile(filePath);
  if (!raw.startsWith("---")) {
    return { raw, frontmatter: null, body: raw };
  }

  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { raw, frontmatter: null, body: raw };
  }

  const fmRaw = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).trimStart();
  return {
    raw,
    frontmatter: yaml.load(fmRaw),
    body,
  };
}

function slugFromFile(fileName) {
  return path.basename(fileName, path.extname(fileName));
}

function indexSquad(squadDir) {
  const manifestPath = path.join(squadDir.path, "squad.yaml");
  const manifest = readYaml(manifestPath);
  const buckets = {};

  for (const bucket of ["agents", "tasks", "workflows", "checklists"]) {
    const entries = manifest?.components?.[bucket] || [];
    buckets[bucket] = entries.map((entry) => ({
      id: slugFromFile(entry),
      file: entry,
      path: path.join(squadDir.path, bucket, entry),
      exists: fs.existsSync(path.join(squadDir.path, bucket, entry)),
    }));
  }

  return {
    id: squadDir.id,
    path: squadDir.path,
    manifestPath,
    manifest,
    agents: buckets.agents,
    tasks: buckets.tasks,
    workflows: buckets.workflows,
    checklists: buckets.checklists,
  };
}

function indexProject() {
  const squads = listTopLevelSquadDirs().map(indexSquad);
  const routing = readYaml(ROUTING_PATH);
  return {
    root: ROOT,
    squads,
    routing,
  };
}

function getAgentIds(squad) {
  return new Set(squad.agents.map((agent) => agent.id));
}

function getTaskIds(squad) {
  return new Set(squad.tasks.map((task) => task.id));
}

function hasHeading(markdownBody, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^##\\s+${escaped}\\s*$`, "im");
  return re.test(markdownBody);
}

function sortBy(arr, selector) {
  return [...arr].sort((a, b) => {
    const left = selector(a);
    const right = selector(b);
    return left.localeCompare(right, "pt-BR");
  });
}

module.exports = {
  CORE_ROOT,
  ROOT,
  ROUTING_PATH,
  SQUADS_ROOT,
  getAgentIds,
  getTaskIds,
  hasHeading,
  indexProject,
  parseMarkdownFrontmatter,
  readFile,
  readYaml,
  slugFromFile,
  sortBy,
};
