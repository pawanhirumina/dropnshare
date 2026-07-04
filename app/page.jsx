"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import {
  Upload,
  X,
  FileIcon,
  Folder,
  Loader2,
  Link as LinkIcon,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, getUserProfile } from "@/lib/auth";
import { Analytics } from "@vercel/analytics/next";
import { toast } from "sonner";

const CODE_LENGTH = 6;

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadCode, setUploadCode] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [expiration, setExpiration] = useState("forever");

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const userProfile = await getUserProfile(currentUser.id);
        setProfile(userProfile);
      }
    };
    loadUser();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.items) {
      const items = Array.from(e.dataTransfer.items);
      const processedItems = [];

      const getFilesFromEntry = async (entry, path = "") => {
        const files = [];
        if (entry.isFile) {
          const file = await new Promise((resolve) => entry.file(resolve));
          Object.defineProperty(file, "webkitRelativePath", {
            value: path + file.name,
            writable: false,
          });
          files.push(file);
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          const entries = await new Promise((resolve) =>
            reader.readEntries(resolve)
          );
          for (const childEntry of entries) {
            const childFiles = await getFilesFromEntry(
              childEntry,
              path + entry.name + "/"
            );
            files.push(...childFiles);
          }
        }
        return files;
      };

      Promise.all(
        items.map(async (item) => {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            if (entry.isFile) {
              const file = await new Promise((resolve) => entry.file(resolve));
              processedItems.push({
                type: "file",
                name: file.name,
                size: file.size,
                data: file,
              });
            } else if (entry.isDirectory) {
              const folderFiles = await getFilesFromEntry(entry);
              const totalSize = folderFiles.reduce((acc, f) => acc + f.size, 0);
              processedItems.push({
                type: "folder",
                name: entry.name,
                size: totalSize,
                data: folderFiles,
              });
            }
          }
        })
      ).then(() => {
        if (processedItems.length > 0) handleItems(processedItems);
      });
    } else if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const items = Array.from(e.dataTransfer.files).map((file) => ({
        type: "file",
        name: file.name,
        size: file.size,
        data: file,
      }));
      handleItems(items);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);

      // Check if it's a folder upload (via webkitdirectory)
      const firstFile = fileList[0];
      const hasRelativePath = firstFile.webkitRelativePath?.includes("/");

      if (hasRelativePath) {
        // Group by top-level folder
        const folderName = firstFile.webkitRelativePath.split("/")[0];
        const totalSize = fileList.reduce((acc, f) => acc + f.size, 0);
        handleItems([
          {
            type: "folder",
            name: folderName,
            size: totalSize,
            data: fileList,
          },
        ]);
      } else {
        const items = fileList.map((file) => ({
          type: "file",
          name: file.name,
          size: file.size,
          data: file,
        }));
        handleItems(items);
      }
    }
  };

  const handleItems = (newItems) => {
    const maxSize = 50 * 1024 * 1024;
    const validItems = newItems.filter((item) => {
      if (item.size > maxSize) {
        toast.error(`${item.type === "folder" ? "Folder" : "File"} too large`, {
          description: `${item.name} exceeds 50MB limit.`,
        });
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...validItems]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);
    try {
      let zipBlob;
      let isSingleZip = false;
      let finalFileName = `bundle_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}.zip`;

      // Determine the best name for the zip
      if (files.length === 1) {
        const item = files[0];
        if (item.type === "folder") {
          finalFileName = `${item.name}.zip`;
        } else if (item.name.toLowerCase().endsWith(".zip")) {
          zipBlob = item.data;
          isSingleZip = true;
          finalFileName = item.name;
        } else {
          finalFileName = `${item.name.split(".")[0]}.zip`;
        }
      }

      if (!isSingleZip) {
        const zip = new JSZip();
        files.forEach((item) => {
          if (item.type === "folder") {
            item.data.forEach((file) => {
              const path =
                file.webkitRelativePath || `${item.name}/${file.name}`;
              zip.file(path, file);
            });
          } else {
            zip.file(item.name, item.data);
          }
        });
        zipBlob = await zip.generateAsync(
          { type: "blob", compression: "DEFLATE" },
          (metadata) => setProgress(Math.round(metadata.percent / 2))
        );
      }
      setProgress(50);

      let code;
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        code = generateCode();
        attempts++;
        const { data } = await supabase
          .from("shared_files")
          .select("code")
          .eq("code", code)
          .maybeSingle();
        if (!data) isUnique = true;
      }
      if (!isUnique) throw new Error("Could not generate unique code");

      const timestamp = Date.now();
      const fileName = isSingleZip
        ? `single_${Date.now()}_${finalFileName}`
        : finalFileName;
      const bucketName = user ? "shared-files-private" : "shared-files-public";

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, zipBlob, {
          contentType: isSingleZip
            ? zipBlob.type || "application/zip"
            : "application/zip",
        });
      if (uploadError) throw uploadError;
      setProgress(75);

      let expiresAt = null;
      if (!user) {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else {
        if (profile?.plan === "pro") {
          if (expiration !== "forever") {
            const hours = parseInt(expiration);
            expiresAt = new Date(
              Date.now() + hours * 60 * 60 * 1000
            ).toISOString();
          }
        } else {
          expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        }
      }

      const { error: dbError } = await supabase.from("shared_files").insert({
        code,
        file_name: `Dropnshare-${Math.floor(100 + Math.random() * 900)}.zip`,
        file_path: fileName,
        file_size: zipBlob.size,
        user_id: user?.id || null,
        bucket_id: bucketName,
        expires_at: expiresAt,
      });
      if (dbError) throw dbError;

      setProgress(100);
      setUploadCode(code);
      setFiles([]);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (uploadCode) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Analytics />
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Upload Complete!</h2>
              <div className="bg-muted p-6 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Share this code:
                </p>
                <p className="text-4xl font-mono font-bold tracking-wider">
                  {uploadCode}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    const link = `${window.location.origin}/download?code=${uploadCode}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Link copied");
                  }}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy Share Link
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(uploadCode);
                      toast.success("Code copied");
                    }}
                  >
                    Copy Code
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setUploadCode(null)}
                  >
                    Upload More
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Drop & Share
          </h1>
          <p className="text-muted-foreground">
            Drag & drop your files below or click to upload. Share with a simple
            6-digit code.
          </p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
            dragActive
              ? "border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
            title=""
          />

          {/* Top Right Control for Pro Users */}
          {user && (profile?.plan === "pro" || profile?.plan === "student") && (
            <div className="absolute top-4 right-4 z-10">
              <div
                className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md shadow-sm hover:border-primary/50 transition-colors pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Expiry:
                  </span>
                </div>
                <select
                  className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer appearance-none pr-4 outline-none"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right center",
                    backgroundSize: "12px",
                  }}
                >
                  <option value="24">24h</option>
                  <option value="168">7d</option>
                  <option value="720">30d</option>
                  <option value="forever">Forever</option>
                </select>
              </div>
            </div>
          )}

          <div className="relative z-10 pointer-events-none space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-primary/20 group-hover:scale-110 transition-transform duration-500">
              <Upload className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-2">
              <p className="text-xl font-bold tracking-tight text-foreground">
                Drop your content here
              </p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Mix and match files and folders. Everything will be zipped
                automatically for sharing.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="pointer-events-auto h-9 font-bold text-xs px-6 rounded-full shadow-sm hover:translate-y-[-1px] transition-transform"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // The underlying input handles files, so we just trigger it
                  const input = e.currentTarget
                    .closest("div.relative")
                    ?.parentElement?.querySelector('input[type="file"]');
                  input?.click();
                }}
              >
                <FileIcon className="w-3.5 h-3.5 mr-2" />
                Add Files
              </Button>
              <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                or
              </span>
              <Button
                variant="outline"
                size="sm"
                className="pointer-events-auto h-9 font-bold text-xs px-6 rounded-full bg-background/50 hover:bg-background shadow-sm hover:translate-y-[-1px] transition-transform"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const input = document.createElement("input");
                  input.type = "file";
                  input.webkitdirectory = true;
                  input.onchange = (e) => handleChange(e);
                  input.click();
                }}
              >
                <Folder className="w-3.5 h-3.5 mr-2" />
                Add Folder
              </Button>
            </div>

            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] pt-4">
              {!user && "Free: 24h Expiry"}
              {user && profile?.plan !== "pro" && "Free: 48h Expiry"}
              {user && profile?.plan === "pro" && "Pro: Custom Expiry"}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {file.type === "folder" ? (
                        <Folder className="w-5 h-5 text-primary" />
                      ) : (
                        <FileIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.type === "folder"
                            ? `${file.data.length} files • ${formatFileSize(
                                file.size
                              )}`
                            : formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {uploading && (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    {progress}%
                  </p>
                </div>
              )}
              <Button
                className="w-full mt-4"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload All Files"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
