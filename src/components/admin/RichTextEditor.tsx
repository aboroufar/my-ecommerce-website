"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadProductImage } from "@/lib/actions/upload";

export function RichTextEditor({
  name = "body_html",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [html, setHtml] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write your post…" }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class:
          "prose-blog min-h-[16rem] px-4 py-3 text-sm text-foreground focus:outline-none [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_img]:my-2 [&_img]:max-w-full [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  function handleLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;

    setUploading(true);
    const result = await uploadProductImage(file);
    setUploading(false);

    if ("error" in result) {
      window.alert(result.error);
      return;
    }
    editor.chain().focus().setImage({ src: result.url }).run();
  }

  return (
    <div className="border border-line">
      <input type="hidden" name={name} value={html} />

      {editor && (
        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface p-2">
          <ToolbarButton
            label="H2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            label="H3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          />
          <ToolbarButton
            label="P"
            active={editor.isActive("paragraph")}
            onClick={() => editor.chain().focus().setParagraph().run()}
          />
          <Divider />
          <ToolbarButton
            label="B"
            bold
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label="I"
            italic
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <Divider />
          <ToolbarButton
            label="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <ToolbarButton
            label="• List"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton label="Link" active={editor.isActive("link")} onClick={handleLink} />
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
      )}

      <EditorContent editor={editor as Editor | null} />
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  bold,
  italic,
  active,
}: {
  label: string;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border border-line px-2.5 py-1 text-xs uppercase tracking-wide text-foreground hover:bg-background ${
        bold ? "font-bold" : ""
      } ${italic ? "italic" : ""} ${active ? "bg-foreground text-background" : ""}`}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-line" />;
}
