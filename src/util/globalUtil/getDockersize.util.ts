// src/utils/docker.util.ts
import Docker from "dockerode";
import logger from "./logger.util";

const docker = new Docker();

export async function getContainerSize(
  containerId: string,
): Promise<string | number | null> {
  try {
    if (!containerId) return null;

    const container = docker.getContainer(containerId);
    const inspectData = await container.stats();
    const data = await container.inspect();
    logger.info("stats", {
      mydata: inspectData.memory_stats.usage,
      inspectdata: data.State.StartedAt,
    });
    return 0;
  } catch (error) {
    console.error(`Error getting size for container ${containerId}:`, error);
    return null;
  }
}

// function formatBytes(bytes: number): string {
//   if (bytes === 0) return "0 Bytes";
//   const k = 1024;
//   const sizes = ["Bytes", "KB", "MB", "GB"];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
// }

void (async () => {
  const containerId =
    "fce98f8568665a24a5aa2ed5879a1272abe55b0db23140db0ba24b61c29db08f";
  const size = await getContainerSize(containerId);
  console.log(`Size of container ${containerId}: ${size}`);
})();
