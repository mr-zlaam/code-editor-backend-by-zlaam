import type Docker from "dockerode";
import type { TCODECONTAINER } from "../db/schemas";

export function returnDockerConfig(
  stoppedContainer: TCODECONTAINER,
  port: number,
  projectName: string,
): Docker.ContainerCreateOptions {
  const userHome = `/home/zlaam`;

  const containerConfig: Docker.ContainerCreateOptions = {
    Image: `lscr.io/linuxserver/code-server:latest`,
    name: stoppedContainer.codeContainerName,
    HostConfig: {
      Binds: [
        `/home/${projectName}:/config/workspace`,

        // Mount binaries and libraries (specific paths from your system)
        `${userHome}/.nvm:/hostnvm:ro`,
        `${userHome}/.nvm/versions/node/v22.14.0/bin:/hostnodebin:ro`,
        `${userHome}/.bun/bin:/hostbunbin:ro`,
        `/home/linuxbrew/.linuxbrew/bin:/hostbrewbin:ro`,
        `/home/linuxbrew/.linuxbrew/Cellar:/hostbrewcellar:ro`,
        `/usr/bin:/hostusrbin:ro`,
        `/usr/lib:/hostusrlib:ro`,
        `/etc/alternatives:/hostalternatives:ro`,
        `/usr/lib/jvm:/hostjvm:ro`,
      ],
      PortBindings: {
        "8443/tcp": [{ HostPort: port.toString() }],
      },
      NetworkMode: "bridge",
    },

    NetworkingConfig: {
      EndpointsConfig: { bridge: {} },
    },

    Env: [
      // Construct PATH from mounted host paths
      `PATH=/hostnodebin:/hostbunbin:/hostbrewbin:/hostusrbin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,
      // Add library path for python and others
      `LD_LIBRARY_PATH=/hostbrewlib:/hostusrlib`,
      `AUTH=none`,
      `DEFAULT_WORKSPACE=/config/workspace`,
      `SUDO_PASSWORD=mypassword`,
    ],
  };

  return containerConfig;
}
