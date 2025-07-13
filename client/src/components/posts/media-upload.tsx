import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Video, X, Upload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface MediaFile {
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  file: File;
}

interface MediaUploadProps {
  onMediaSelect: (media: MediaFile[]) => void;
  selectedMedia: MediaFile[];
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function MediaUpload({ 
  onMediaSelect, 
  selectedMedia, 
  maxFiles = 5,
  acceptedTypes = [
    "image/*", 
    "video/*",
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg",
    ".mp4", ".avi", ".mov", ".wmv", ".mkv", ".flv", ".webm", ".3gp"
  ]
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      toast({
        title: "Không có file nào được chọn",
        description: "Vui lòng chọn ít nhất một file để tải lên.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const newMediaFiles: MediaFile[] = [];

    for (const file of files) {
      if (selectedMedia.length + newMediaFiles.length >= maxFiles) {
        toast({
          title: "Đã đạt giới hạn file",
          description: `Chỉ có thể tải lên tối đa ${maxFiles} file.`,
          variant: "destructive",
        });
        break;
      }

      try {
        console.log("Processing file:", file.name, file.type, file.size);
        const mediaFile = await processFile(file);
        if (mediaFile) {
          console.log("Successfully processed file:", file.name);
          newMediaFiles.push(mediaFile);
        } else {
          console.error("Failed to process file:", file.name);
          toast({
            title: "Lỗi xử lý file",
            description: `Không thể xử lý file ${file.name}. Định dạng file có thể không được hỗ trợ.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error processing file:", file.name, error);
        toast({
          title: "Lỗi xử lý file",
          description: `Có lỗi xảy ra khi xử lý file ${file.name}. Vui lòng thử lại.`,
          variant: "destructive",
        });
      }
    }

    if (newMediaFiles.length > 0) {
      onMediaSelect([...selectedMedia, ...newMediaFiles]);
      toast({
        title: "Tải lên thành công",
        description: `Đã tải lên ${newMediaFiles.length} file thành công.`,
      });
    }

    setIsUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = (file: File): Promise<MediaFile | null> => {
    return new Promise((resolve) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error("File processing timeout for:", file.name);
        resolve(null);
      }, 10000); // 10 second timeout
      
      const clearTimeoutAndResolve = (result: MediaFile | null) => {
        clearTimeout(timeout);
        resolve(result);
      };
      const isImage = file.type.startsWith("image/") || 
                     /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);
      const isVideo = file.type.startsWith("video/") || 
                     /\.(mp4|avi|mov|wmv|mkv|flv|webm|3gp)$/i.test(file.name);

      if (isImage) {
        // Simple approach: Just use FileReader without complex processing
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const result = e.target?.result as string;
            if (!result) {
              clearTimeoutAndResolve(null);
              return;
            }

            // Try to compress only if the image is large
            if (result.length > 500000) { // 500KB
              // Use canvas for compression
              const img = new Image();
              img.onload = () => {
                try {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  
                  if (!ctx) {
                    // Fallback to original if canvas fails
                    clearTimeoutAndResolve({
                      type: "image",
                      url: result,
                      file,
                    });
                    return;
                  }
                  
                  // Calculate new dimensions (max 800px for compression)
                  const maxWidth = 800;
                  const maxHeight = 800;
                  let { width, height } = img;
                  
                  if (width > height) {
                    if (width > maxWidth) {
                      height = (height * maxWidth) / width;
                      width = maxWidth;
                    }
                  } else {
                    if (height > maxHeight) {
                      width = (width * maxHeight) / height;
                      height = maxHeight;
                    }
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  ctx.drawImage(img, 0, 0, width, height);
                  
                  // Compress with 70% quality
                  const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                  
                  clearTimeoutAndResolve({
                    type: "image",
                    url: compressedDataUrl,
                    file,
                  });
                } catch (error) {
                  console.error("Canvas compression error:", error);
                  // Fallback to original
                  clearTimeoutAndResolve({
                    type: "image",
                    url: result,
                    file,
                  });
                }
              };
              
              img.onerror = () => {
                // Fallback to original if image can't be loaded
                clearTimeoutAndResolve({
                  type: "image",
                  url: result,
                  file,
                });
              };
              
              img.src = result;
            } else {
              // Image is small enough, use as-is
              clearTimeoutAndResolve({
                type: "image",
                url: result,
                file,
              });
            }
          } catch (error) {
            console.error("Error processing image with FileReader:", error);
            clearTimeoutAndResolve(null);
          }
        };
        
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          clearTimeoutAndResolve(null);
        };
        
        try {
          reader.readAsDataURL(file);
        } catch (error) {
          console.error("Error reading file:", error);
          clearTimeoutAndResolve(null);
        }
      } else if (isVideo) {
        // Simple approach for videos: Just use FileReader
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const result = e.target?.result as string;
            if (!result) {
              clearTimeoutAndResolve(null);
              return;
            }

            clearTimeoutAndResolve({
              type: "video",
              url: result,
              file,
            });
          } catch (error) {
            console.error("Error processing video with FileReader:", error);
            clearTimeoutAndResolve(null);
          }
        };
        
        reader.onerror = (error) => {
          console.error("FileReader error for video:", error);
          clearTimeoutAndResolve(null);
        };
        
        try {
          reader.readAsDataURL(file);
        } catch (error) {
          console.error("Error reading video file:", error);
          clearTimeoutAndResolve(null);
        }
      } else {
        // Unsupported file type
        console.warn("Unsupported file type:", file.type, file.name);
        clearTimeoutAndResolve(null);
      }
    });
  };

  const removeMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index);
    onMediaSelect(newMedia);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={(event) => {
          console.log("File input changed:", event.target.files?.length || 0, "files");
          handleFileSelect(event);
        }}
        className="hidden"
      />

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            console.log("Opening file dialog for images");
            openFileDialog();
          }}
          disabled={isUploading || selectedMedia.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <Image className="w-4 h-4" />
          {isUploading ? "Đang tải..." : "Thêm ảnh"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            console.log("Opening file dialog for videos");
            openFileDialog();
          }}
          disabled={isUploading || selectedMedia.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <Video className="w-4 h-4" />
          {isUploading ? "Đang tải..." : "Thêm video"}
        </Button>
      </div>

      {/* Selected Media Preview */}
      {selectedMedia.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {selectedMedia.map((media, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center relative">
                      {media.thumbnailUrl ? (
                        <img
                          src={media.thumbnailUrl}
                          alt={`Video thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Video className="w-8 h-8 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-2">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-end p-2">
                        <span className="text-xs bg-black/70 text-white px-2 py-1 rounded">
                          {media.file.name}
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedMedia.length >= maxFiles && (
        <p className="text-sm text-muted-foreground">
          Maximum {maxFiles} files allowed
        </p>
      )}
    </div>
  );
}