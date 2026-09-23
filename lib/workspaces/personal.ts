/**
 * Workspace architecture.
 * Today every user has a single personal workspace. Team workspaces are not
 * implemented — do not invent teams, members, or shared fake spaces in the UI.
 */

export const WORKSPACE_KINDS = ["personal", "team"] as const;
export type WorkspaceKind = (typeof WORKSPACE_KINDS)[number];

export type Workspace = {
  id: string;
  kind: WorkspaceKind;
  name: string;
};

export const PERSONAL_WORKSPACE_ID = "personal";

export function personalWorkspace(): Workspace {
  return {
    id: PERSONAL_WORKSPACE_ID,
    kind: "personal",
    name: "Shaxsiy ish maydoni",
  };
}

export function listVisibleWorkspaces(): Workspace[] {
  return [personalWorkspace()];
}

export function isPersonalWorkspace(id: string | null | undefined) {
  return !id || id === PERSONAL_WORKSPACE_ID;
}
