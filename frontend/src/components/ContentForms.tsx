import { FormEvent, useEffect, useState } from "react";
import type { Lesson, LessonPayload, ModulePayload, CourseModule } from "../types/content";

type ModuleFormProps = {
  module?: CourseModule | null;
  isSubmitting: boolean;
  onSubmit: (payload: ModulePayload) => Promise<void>;
  onCancel?: () => void;
};

export function ModuleForm({ module, isSubmitting, onSubmit, onCancel }: ModuleFormProps) {
  const [title, setTitle] = useState(module?.title ?? "");
  const [position, setPosition] = useState(String(module?.position ?? 1));

  useEffect(() => {
    setTitle(module?.title ?? "");
    setPosition(String(module?.position ?? 1));
  }, [module]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ title, position: Number(position) });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_120px_auto]">
      <input
        aria-label="Module title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        minLength={2}
        placeholder="Module title"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <input
        aria-label="Module position"
        type="number"
        min={1}
        value={position}
        onChange={(event) => setPosition(event.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : module ? "Update" : "Add module"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

type LessonFormProps = {
  lesson?: Lesson | null;
  moduleId: number;
  isSubmitting: boolean;
  onSubmit: (moduleId: number, payload: LessonPayload) => Promise<void>;
  onCancel?: () => void;
};

export function LessonForm({ lesson, moduleId, isSubmitting, onSubmit, onCancel }: LessonFormProps) {
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [content, setContent] = useState(lesson?.content ?? "");
  const [position, setPosition] = useState(String(lesson?.position ?? 1));

  useEffect(() => {
    setTitle(lesson?.title ?? "");
    setContent(lesson?.content ?? "");
    setPosition(String(lesson?.position ?? 1));
  }, [lesson]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(moduleId, { title, content, position: Number(position) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_120px]">
        <input
          aria-label="Lesson title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          minLength={2}
          placeholder="Lesson title"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <input
          aria-label="Lesson position"
          type="number"
          min={1}
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <textarea
        aria-label="Lesson content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={3}
        placeholder="Lecture notes, slide deck link, or lesson content"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : lesson ? "Update lesson" : "Add lesson"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
