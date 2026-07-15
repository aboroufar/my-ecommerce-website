"use client";

import { useState } from "react";
import {
  createHelpCategory,
  updateHelpCategory,
  deleteHelpCategory,
  moveHelpCategory,
  createHelpTopic,
  updateHelpTopic,
  deleteHelpTopic,
  moveHelpTopic,
} from "@/lib/actions/help";
import { HELP_ICON_KEYS, HELP_ICON_LABELS, HelpIcon, type HelpIconKey } from "@/components/helpIcons";

interface HelpTopic {
  id: string;
  title: string;
  body_html: string;
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  topics: HelpTopic[];
}

export function HelpManager({ categories }: { categories: HelpCategory[] }) {
  const [addingCategory, setAddingCategory] = useState(false);

  return (
    <div className="max-w-3xl">
      <div className="space-y-4">
        {categories.map((category, i) => (
          <CategoryEditor
            key={category.id}
            category={category}
            index={i}
            total={categories.length}
          />
        ))}
      </div>

      {addingCategory ? (
        <CategoryForm
          action={createHelpCategory}
          onDone={() => setAddingCategory(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAddingCategory(true)}
          className="mt-6 border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          + Add category
        </button>
      )}
    </div>
  );
}

function CategoryEditor({
  category,
  index,
  total,
}: {
  category: HelpCategory;
  index: number;
  total: number;
}) {
  const [editing, setEditing] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  return (
    <div className="border border-line bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <form action={moveHelpCategory.bind(null, category.id, "up")}>
            <button
              type="submit"
              disabled={index === 0}
              aria-label="Move up"
              className="text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
            >
              ↑
            </button>
          </form>
          <form action={moveHelpCategory.bind(null, category.id, "down")}>
            <button
              type="submit"
              disabled={index === total - 1}
              aria-label="Move down"
              className="text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
            >
              ↓
            </button>
          </form>
        </div>
        <div className="flex-1">
          {editing ? (
            <CategoryForm
              category={category}
              action={updateHelpCategory.bind(null, category.id)}
              onDone={() => setEditing(false)}
            />
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="text-left">
              <div className="flex items-center gap-2 text-accent">
                <HelpIcon icon={category.icon} />
                <span className="font-display text-sm font-bold text-foreground hover:underline">
                  {category.title}
                </span>
              </div>
              {category.description && (
                <p className="mt-1 text-xs text-muted">{category.description}</p>
              )}
            </button>
          )}
        </div>
        <form action={deleteHelpCategory.bind(null, category.id)}>
          <button
            type="submit"
            aria-label="Delete category"
            className="shrink-0 text-xs text-red-700 hover:text-red-800"
          >
            ×
          </button>
        </form>
      </div>

      <ul className="mt-3 space-y-2 border-t border-line pt-3">
        {category.topics.map((topic, i) =>
          editingTopicId === topic.id ? (
            <li key={topic.id}>
              <TopicForm
                topic={topic}
                action={updateHelpTopic.bind(null, topic.id)}
                onDone={() => setEditingTopicId(null)}
              />
            </li>
          ) : (
            <li key={topic.id} className="group flex items-start justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={() => setEditingTopicId(topic.id)}
                className="text-left text-foreground hover:underline"
              >
                {topic.title}
              </button>
              <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <form action={moveHelpTopic.bind(null, topic.id, category.id, "up")}>
                  <button
                    type="submit"
                    disabled={i === 0}
                    aria-label="Move up"
                    className="text-xs text-muted hover:text-foreground disabled:opacity-30"
                  >
                    ↑
                  </button>
                </form>
                <form action={moveHelpTopic.bind(null, topic.id, category.id, "down")}>
                  <button
                    type="submit"
                    disabled={i === category.topics.length - 1}
                    aria-label="Move down"
                    className="text-xs text-muted hover:text-foreground disabled:opacity-30"
                  >
                    ↓
                  </button>
                </form>
                <form action={deleteHelpTopic.bind(null, topic.id)}>
                  <button
                    type="submit"
                    aria-label="Delete"
                    className="text-xs text-red-700 hover:text-red-800"
                  >
                    ×
                  </button>
                </form>
              </div>
            </li>
          )
        )}
      </ul>

      {addingTopic ? (
        <div className="mt-3">
          <TopicForm
            action={createHelpTopic}
            categoryId={category.id}
            onDone={() => setAddingTopic(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingTopic(true)}
          className="mt-3 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:text-foreground"
        >
          + Add topic
        </button>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  action,
  onDone,
}: {
  category?: HelpCategory;
  action: (formData: FormData) => void;
  onDone: () => void;
}) {
  return (
    <form action={action} className="space-y-2 border border-line bg-surface p-3">
      <input
        name="title"
        defaultValue={category?.title}
        required
        placeholder="Category title"
        autoFocus
        className="w-full border border-line bg-background px-2 py-1.5 text-sm"
      />
      <textarea
        name="description"
        defaultValue={category?.description}
        rows={2}
        placeholder="Short description (optional)"
        className="w-full border border-line bg-background px-2 py-1.5 text-sm"
      />
      <select
        name="icon"
        defaultValue={category?.icon ?? HELP_ICON_KEYS[0]}
        className="w-full border border-line bg-background px-2 py-1.5 text-sm"
      >
        {HELP_ICON_KEYS.map((key) => (
          <option key={key} value={key}>
            {HELP_ICON_LABELS[key as HelpIconKey]}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-accent px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-background"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-medium uppercase tracking-wide text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TopicForm({
  topic,
  categoryId,
  action,
  onDone,
}: {
  topic?: HelpTopic;
  categoryId?: string;
  action: (formData: FormData) => void;
  onDone: () => void;
}) {
  return (
    <form action={action} className="space-y-1.5 border border-line bg-surface p-2">
      {categoryId && <input type="hidden" name="category_id" value={categoryId} />}
      <input
        name="title"
        defaultValue={topic?.title}
        required
        placeholder="Topic title"
        autoFocus
        className="w-full border border-line bg-background px-2 py-1 text-xs"
      />
      <textarea
        name="body_html"
        defaultValue={topic?.body_html}
        rows={3}
        placeholder="Answer text"
        className="w-full border border-line bg-background px-2 py-1 text-xs"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-accent px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-background"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-[10px] font-medium uppercase tracking-wide text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
