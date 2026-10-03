/**
 * Manual database backup: `npm run backup`
 *
 * Downloads a complete copy of the Realtime Database (every journal, memory,
 * note and mood) to a dated JSON file OUTSIDE this project folder, so it can
 * never be committed to the public GitHub repository by accident.
 *
 * Default location: <your home>/SameSky-Backups  (e.g. C:\Users\you\SameSky-Backups)
 * — deliberately not Documents, which OneDrive often syncs to the cloud.
 * Override with:    npm run backup -- "D:\\Some\\Private\\Folder"
 *
 * Needs `firebase login` once on this computer. Prints only the file size and
 * section names — never the private contents.
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";

const PROJECT = "tracker-25c92";
const projectRoot = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const folder = resolve(process.argv[2] ?? join(homedir(), "SameSky-Backups"));

if (folder === projectRoot || folder.startsWith(projectRoot + sep)) {
  console.error("Refusing to save a backup inside the project folder — it could end up on GitHub.");
  process.exit(1);
}

// An unencrypted copy must never sync to a cloud drive on its own.
if (/onedrive|google drive|dropbox|icloud/i.test(folder)) {
  console.error("Refusing to save into a cloud-synced folder. Encrypt the backup first, then upload the locked copy yourself.");
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
const SEVEN_ZIP = ["C:\\Program Files\\7-Zip\\7z.exe", "C:\\Program Files (x86)\\7-Zip\\7z.exe"].find((candidate) =>
  existsSync(candidate),
);

if (SEVEN_ZIP && process.stdin.isTTY) {
  const locked = file.replace(/\.json$/, ".7z");

  console.log("\nNow lock it with a password. Type it twice (nothing appears as you type, that's normal).");
  console.log("Use something long, like four random words, and save it in your password manager.\n");

  // -p with no value makes 7-Zip ask for the password itself; -mhe=on hides file names too.
  const result = spawnSync(SEVEN_ZIP, ["a", "-t7z", "-mhe=on", "-p", locked, file], { stdio: "inherit" });

  if (result.status === 0 && existsSync(locked) && statSync(locked).size > 0) {
    unlinkSync(file);
    console.log(`\nLocked: ${locked}`);
    console.log("The unlocked copy has been deleted. Upload the .7z file to a private cloud folder.");
  } else {
    console.log("\nLocking didn't finish, so the unlocked copy was kept. Run `npm run backup` again to retry.");
  }
} else {
  console.log("\nThis file holds private data. Keep it out of shared folders, and encrypt it before uploading anywhere.");
}
