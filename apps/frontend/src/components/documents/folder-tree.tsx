"use client";

import { useEffect, useState } from "react";
import { NavLink, ThemeIcon, Loader } from "@mantine/core";
import { IconFolder, IconFolderOpen } from "@tabler/icons-react";
import type { Folder } from "@/types";
import { listContents } from "@/lib/api/documents";

interface FolderTreeProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface TreeNodeProps {
  folder: Folder;
  currentPath: string;
  depth: number;
  onNavigate: (path: string) => void;
}

function TreeNode({ folder, currentPath, depth, onNavigate }: TreeNodeProps) {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const isActive = currentPath === folder.path || currentPath.startsWith(folder.path + "/");

  const handleClick = () => {
    onNavigate(folder.path);
    if (!open) {
      setOpen(true);
      if (children.length === 0) {
        setLoading(true);
        listContents(folder.path)
          .then((c) => setChildren(c.folders))
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    } else {
      setOpen(false);
    }
  };

  return (
    <NavLink
      label={folder.name}
      active={isActive}
      opened={open}
      onClick={handleClick}
      pl={depth * 12}
      leftSection={
        <ThemeIcon variant="light" size="sm">
          {open ? <IconFolderOpen size={14} /> : <IconFolder size={14} />}
        </ThemeIcon>
      }
      rightSection={loading ? <Loader size="xs" /> : undefined}
    >
      {open && children.map((child) => (
        <TreeNode key={child.path} folder={child} currentPath={currentPath} depth={depth + 1} onNavigate={onNavigate} />
      ))}
    </NavLink>
  );
}

export function FolderTree({ currentPath, onNavigate }: FolderTreeProps) {
  const [rootFolders, setRootFolders] = useState<Folder[]>([]);

  useEffect(() => {
    listContents("").then((c) => setRootFolders(c.folders)).catch(() => {});
  }, []);

  return (
    <>
      <NavLink
        label="Documenti"
        active={currentPath === ""}
        onClick={() => onNavigate("")}
        leftSection={
          <ThemeIcon variant="light" size="sm">
            <IconFolder size={14} />
          </ThemeIcon>
        }
      />
      {rootFolders.map((folder) => (
        <TreeNode key={folder.path} folder={folder} currentPath={currentPath} depth={1} onNavigate={onNavigate} />
      ))}
    </>
  );
}
