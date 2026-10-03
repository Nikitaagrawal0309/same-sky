/**
 * Manual database backup: `npm run backup`
 *
 * Downloads a complete copy of the Realtime Database (every journal, memory,
 * note and mood) to a dated JSON file OUTSIDE this project folder, so it can
 * never be committed to the public GitHub repository by accident.
 *
 * Default location: <your home>/Documents/SameSky-Backups
 * Override with:    npm run backup -- "D:\\Some\\Private\\Folder"
 *
 * Needs `firebase login` once on this computer. Prints only the file size and
 * section names — never the private contents.
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";

const PROJECT = "tracker-25c92";
const projectRoot = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const folder = resolve(process.argv[2] ?? join(homedir(), "Documents", "SameSky-Backups"));

if (folder === projectRoot || folder.startsWith(projectRoot + sep)) {
  console.error("Refusing to save a backup inside the project folder — it could end up on GitHub.");
  process.exit(1);
}

mkdirSync(folder, { recursive: true });

const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
const file = join(folder, `same-sky-backup-${stamp}.json`);

console.log(`Backing up ${PROJECT} …`);
execSync(`npx -y firebase-tools database:get / --project ${PROJECT} --output "${file}"`, { stdio: ["ignore", "ignore", "inherit"] });

const data = JSON.parse(readFileSync(file, "utf8")) ?? {};
const kilobytes = Math.round(statSync(file).size / 1024);

console.log(`\nSaved: ${file}`);
console.log(`Size:  ${kilobytes} KB`);
console.log(`Contains: ${Object.keys(data).join(", ") || "(empty database)"}`);
console.log("\nThis file holds private data. Keep it out of shared folders, and encrypt it before uploading anywhere.");
