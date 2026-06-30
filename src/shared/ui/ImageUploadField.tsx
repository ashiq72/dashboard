import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Image as ImageIcon, UploadCloud, X } from "lucide-react";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

type ImageUploadFieldProps = {
  title: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingUrls?: string[];
  multiple?: boolean;
  compact?: boolean;
};

export function ImageUploadField({
  title,
  files,
  onFilesChange,
  existingUrls = [],
  multiple = false,
  compact = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const acceptFiles = (incoming: File[]) => {
    const next: File[] = [];
    for (const file of incoming) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        setError("Choose JPEG or PNG images");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError("Each image must be 5 MB or smaller");
        return;
      }
      next.push(file);
    }

    setError("");
    onFilesChange(multiple ? [...files, ...next].slice(0, 10) : next.slice(0, 1));
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFiles(Array.from(event.target.files || []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFiles(Array.from(event.dataTransfer.files || []));
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  const visibleExisting = existingUrls.filter(Boolean).slice(0, multiple ? 10 : 1);

  return (
    <div className={`image-uploader ${compact ? "compact" : ""}`}>
      <div
        className={`image-dropzone ${dragging ? "dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="image-upload-icon">
          <UploadCloud size={20} />
        </span>
        <div>
          <strong>{title}</strong>
          <span>JPEG or PNG, up to 5 MB</span>
        </div>
        <button
          className="ghost-button small"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon size={15} />
          Choose {multiple ? "images" : "image"}
        </button>
        <input
          ref={inputRef}
          hidden
          multiple={multiple}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleInput}
        />
      </div>

      {error && <span className="image-upload-error">{error}</span>}

      {(previews.length > 0 || visibleExisting.length > 0) && (
        <div className="image-upload-previews">
          {previews.map((preview, index) => (
            <div className="image-upload-preview new" key={preview}>
              <img src={preview} alt="" />
              <span>New</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label="Remove selected image"
                title="Remove selected image"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {visibleExisting.map((url) => (
            <div className="image-upload-preview" key={url}>
              <img src={url} alt="" />
              <span>Current</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
