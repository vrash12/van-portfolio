import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, "assets");

// These folders exist inside /assets/ based on your screenshot
const PROJECT_FOLDERS = ["pgtonboard", "fabella", "patientcare", "gomez"];

const ALLOWED_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif",
  ".mp4", ".webm", ".mov", ".m4v",
]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      const sub = await walk(full);
      out.push(...sub);
    } else {
      out.push(full);
    }
  }
  return out;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

async function main() {
  const manifest = {};

  for (const proj of PROJECT_FOLDERS) {
    const projDir = path.join(ASSETS_DIR, proj);

    let files = [];
    try {
      files = await walk(projDir);
    } catch (e) {
      console.warn(`Skipping ${proj} (folder not found):`, projDir);
      manifest[proj] = [];
      continue;
    }

    const rel = files
      .map((f) => ({
        abs: f,
        rel: toPosix(path.relative(projDir, f)),
        ext: path.extname(f).toLowerCase(),
      }))
      .filter((x) => ALLOWED_EXT.has(x.ext))
      .map((x) => x.rel)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    manifest[proj] = rel;
  }

  const outPath = path.join(ASSETS_DIR, "projects.manifest.json");
  await fs.writeFile(outPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log("✅ Wrote:", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
