import type Docker from "dockerode";
import type { TCODECONTAINER } from "../db/schemas";

export function returnDockerConfig(
  stoppedContainer: TCODECONTAINER,
  port: number,
): Docker.ContainerCreateOptions {
  const containerConfig: Docker.ContainerCreateOptions = {
    Image: `linuxserver/code-server:latest`,
    name: stoppedContainer.codeContainerName,
    HostConfig: {
      Binds: [
        `/home/${stoppedContainer.codeContainerName}:/config/workspace`,
        `/usr/bin:/usr/bin:ro`,
      ],
      PortBindings: {
        "8443/tcp": [{ HostPort: port.toString() }],
      },
    },
    Env: [`PATH=/usr/bin:/bin:/usr/sbin:/sbin`],
  };
  return containerConfig;
}
