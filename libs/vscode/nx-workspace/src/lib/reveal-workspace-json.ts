import { buildProjectPath } from '@nx-console/utils';
import { WorkspaceConfigurationStore } from '@nx-console/vscode/configuration';
import { join } from 'path';
import { Selection, TextDocument, Uri, window, workspace } from 'vscode';

import { getProjectLocations } from './find-workspace-json-target';
import { fileExists } from '@nx-console/file-system';

export async function revealNxProject(
  projectName: string,
  root: string,
  target?: { name: string; configuration?: string }
) {
  const workspacePath = WorkspaceConfigurationStore.instance.get(
    'nxWorkspacePath',
    ''
  );
  const projectPath = await buildProjectPath(workspacePath, root);
  const workspaceJsonPath = join(workspacePath, 'workspace.json');
  const angularJsonPath = join(workspacePath, 'angular.json');

  let path = workspacePath;
  if (await fileExists(angularJsonPath)) {
    path = angularJsonPath;
  } else if (projectPath) {
    path = projectPath;
  } else if (await fileExists(workspaceJsonPath)) {
    path = workspaceJsonPath;
  }

  const document: TextDocument = await workspace.openTextDocument(
    Uri.file(path)
  );

  const projectLocations = getProjectLocations(document, projectName);

  let offset = projectLocations[projectName].position;
  if (target) {
    const projectTarget = projectLocations[projectName].targets?.[target.name];
    if (projectTarget) {
      const targetConfiguration =
        projectTarget.configurations?.[target.configuration || ''];

      if (targetConfiguration) {
        offset = targetConfiguration.position;
      } else {
        offset = projectTarget.position;
      }
    }
  }

  const position = document.positionAt(offset);
  await window.showTextDocument(document, {
    selection: new Selection(position, position),
  });
}
