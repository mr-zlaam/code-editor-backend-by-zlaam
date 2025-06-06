import type Docker from "dockerode";
import { createUniqueWorkspace } from "../util/globalUtil/createUniqueWorkspace.util";
import { returnTemplateBasedOnTech } from "../util/appUtil/folderUtil/returnTemplateBasedOnTech.util";
export function returnDockerConfig(
  port: number,
  username: string,
  fileNameSlug: string,
  tech: string,
): Docker.ContainerCreateOptions {
  const hostPath = createUniqueWorkspace(username, fileNameSlug);
  const repoURI = returnTemplateBasedOnTech(tech);
  console.info(repoURI);

  const containerConfig: Docker.ContainerCreateOptions = {
    Image: `zlaam/code-server-dev:latest`,
    name: `code-${username}-${fileNameSlug}`,

    HostConfig: {
      Binds: [`${hostPath}:/config/workspace`], // Critical mount
      PortBindings: {
        "8443/tcp": [{ HostPort: port.toString() }],
      },
      NetworkMode: "bridge",
    },

    NetworkingConfig: {
      EndpointsConfig: { bridge: {} },
    },
  };

  return containerConfig;
}
