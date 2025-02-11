import crypto from "node:crypto";
import { LogicProject } from "./recent-logic-pro-projects";
import { promisify } from "node:util";
import { exec } from "node:child_process";
import { getPreferenceValues } from "@raycast/api";

export const findProjects = (): Promise<LogicProject[]> => {
  const location = getPreferenceValues<Preferences>()["projects-location"];
  const execAsync = promisify(exec);
  return execAsync(
    `find ${location} -regex ".*\\.\\(logicx\\)" | head -n 200 | xargs -I{} stat -f "%N,%m" "{}"`,
  )
    .then((result) => {
      if (result.stderr !== null && result.stderr !== "") {
        return [];
      }
      const projects: LogicProject[] = result.stdout
        .trim()
        .split("\n")
        .filter((entry) => entry.includes(","))
        .map((entry) => {
          const [p, lastModified] = entry.split(",");
          const lastModifiedDate = new Date(Number(lastModified) * 1000);
          const lastSlashIndex = p.lastIndexOf("/");
          const afterLastSlash = p.substring(lastSlashIndex + 1);
          return {
            name: afterLastSlash,
            lastModified: isNaN(lastModifiedDate.getTime()) ? new Date(0) : lastModifiedDate, // Handle invalid dates
            id: crypto.createHash("md5").update(entry).digest("hex"),
            path: p,
          };
        })
        .sort((a, b) => {
          if (a.lastModified < b.lastModified) {
            return 1;
          }
          return -1;
        });
      return projects;
    })
    .catch(() => {
      return [];
    });
};
