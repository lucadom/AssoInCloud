"use client";

import { useRef, useState } from "react";
import { Box, Text, Progress } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { uploadFiles } from "@/lib/api/documents";
import type { DocumentFile } from "@/types";

interface UploadZoneProps {
  currentPath: string;
  onUploadComplete: (files: DocumentFile[]) => void;
  children: React.ReactNode;
}

export function UploadZone({ currentPath, onUploadComplete, children }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dragCounter = useRef(0);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const result = await uploadFiles(currentPath, files);
      onUploadComplete(result);
      notifications.show({
        title: "Upload completato",
        message: `${result.length} file caricati con successo`,
        color: "green",
      });
    } catch (e: unknown) {
      notifications.show({
        title: "Errore upload",
        message: e instanceof Error ? e.message : "Errore nel caricamento",
        color: "red",
      });
    } finally {
      setUploading(false);
    }
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  return (
    <Box
      style={{ position: "relative", outline: dragging ? "2px dashed var(--mantine-color-blue-5)" : undefined, borderRadius: 8 }}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {dragging && (
        <Box
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(var(--mantine-color-blue-1-rgb), 0.5)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            pointerEvents: "none",
          }}
        >
          <Text fw={600} c="blue">
            Rilascia i file qui
          </Text>
        </Box>
      )}
      {uploading && <Progress value={100} animated size="xs" mb="xs" />}
      {children}
    </Box>
  );
}
