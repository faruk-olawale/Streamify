import { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, File } from "lucide-react";

const SharedFiles = ({ channel }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channel) return;

    const fetchFiles = async () => {
      setLoading(true);
      try {
        const response = await channel.query({
          messages: { limit: 100 },
        });

        const fileItems = [];
        response.messages.forEach((message) => {
          if (message.attachments && message.attachments.length > 0) {
            message.attachments.forEach((attachment) => {
              if (attachment.type === "file" || 
                  (attachment.mime_type && !attachment.mime_type.startsWith('image') && !attachment.mime_type.startsWith('video'))) {
                fileItems.push({
                  id: `${message.id}-${attachment.asset_url}`,
                  name: attachment.title || attachment.fallback || "Unknown File",
                  url: attachment.asset_url || attachment.file_url,
                  size: attachment.file_size || 0,
                  type: attachment.mime_type || "application/octet-stream",
                  timestamp: message.created_at,
                  user: message.user,
                });
              }
            });
          }
        });

        fileItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setFiles(fileItems);
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [channel]);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "Unknown size";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileIcon = (type) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("sheet") || type.includes("excel")) return "📊";
    if (type.includes("presentation") || type.includes("powerpoint")) return "📽️";
    if (type.includes("zip") || type.includes("rar")) return "🗜️";
    if (type.includes("text")) return "📃";
    return "📎";
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileText size={32} className="text-primary/50" />
        </div>
        <p className="text-sm text-base-content/50 font-medium">No files shared yet</p>
        <p className="text-xs text-base-content/40 mt-1">Share documents in the chat</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-4 p-4 bg-base-200/50 rounded-xl border border-base-300/50 hover:bg-base-200 hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex-shrink-0">
            <span className="text-2xl">{getFileIcon(file.type)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate mb-0.5">{file.name}</p>
            <div className="flex items-center gap-2 text-xs text-base-content/50">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{new Date(file.timestamp).toLocaleDateString()}</span>
              <span>•</span>
              <span>{file.user?.name || "Unknown"}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => downloadFile(file.url, file.name)}
              className="btn btn-sm btn-circle btn-ghost hover:btn-primary"
              title="Download"
            >
              <Download size={16} />
            </button>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-circle btn-ghost hover:btn-secondary"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SharedFiles;