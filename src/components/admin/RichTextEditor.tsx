"use client";

import { useEffect, useRef, useState } from "react";
import { uploadProductImage } from "@/lib/actions/upload";

/**
 * Small contentEditable-based editor -- no external rich-text library in
 * this codebase, so this covers just what blog posts need: headings,
 * bold/italic, links, blockquotes, and inline images. Outputs raw HTML
 * into a hidden input (name="body_html") for the surrounding form to
 * submit; execCommand is deprecated but still the simplest way to get
 * basic formatting without a dependency, and every command here degrades
 * gracefully (worst case: plain text stays plain text).
 */
export function RichTextEditor({
  name = "body_html",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = defaultValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- set once on mount
  }, []);

  function exec(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncHtml();
  }

  function syncHtml() {
    setHtml(editorRef.current?.innerHTML ?? "");
  }

  function handleLink() {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    const result = await uploadProductImage(file);
    setUploading(false);

    if ("error" in result) {
      window.alert(result.error);
      return;
    }
    exec("insertImage", result.url);
  }

  return (
    <div className="border border-line">
      <input type="hidden" name={name} value={html} />

      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface p-2">
        <ToolbarButton label="H2" onClick={() => exec("formatBlock", "<h2>")} />
        <ToolbarButton label="H3" onClick={() => exec("formatBlock", "<h3>")} />
        <ToolbarButton label="P" onClick={() => exec("formatBlock", "<p>")} />
        <Divider />
        <ToolbarButton label="B" bold onClick={() => exec("bold")} />
        <ToolbarButton label="I" italic onClick={() => exec("italic")} />
        <Divider />
        <ToolbarButton label="Quote" onClick={() => exec("formatBlock", "<blockquote>")} />
        <ToolbarButton label="• List" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton label="Link" onClick={handleLink} />
        <Divider />
        <label className="cursor-pointer border border-line px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-foreground hover:bg-background">
          {uploading ? "Uploading…" : "Image"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={syncHtml}
        onBlur={syncHtml}
        className="prose-blog min-h-[16rem] px-4 py-3 text-sm text-foreground focus:outline-none [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_img]:my-2 [&_img]:max-w-full [&_p]:my-2"
        suppressContentEditableWarning
      />
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  bold,
  italic,
}: {
  label: string;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border border-line px-2.5 py-1 text-xs uppercase tracking-wide text-foreground hover:bg-background ${
        bold ? "font-bold" : ""
      } ${italic ? "italic" : ""}`}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-line" />;
}
