import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createAssignment,
  deleteAssignment,
  fetchCourseAssignments,
  updateAssignment
} from "../../api/assignments";
import {
  createLesson,
  deleteLesson,
  fetchCourseContent,
  updateLesson
} from "../../api/content";
import { fetchCourse } from "../../api/courses";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Assignment, AssignmentPayload } from "../../types/assignment";
import type { Lesson, LessonPayload, ModuleWithLessons } from "../../types/content";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

const SLIDE_PREFIX = "[Lecture Slide]";

type AssignmentFormState = {
  title: string;
  description: string;
  dueDate: string;
  maxPoints: string;
};

const emptyAssignmentForm: AssignmentFormState = {
  title: "",
  description: "",
  dueDate: "",
  maxPoints: "100"
};

type SlideFormState = {
  title: string;
  content: string;
};

const emptySlideForm: SlideFormState = {
  title: "",
  content: ""
};

function getModulePrefix(module: ModuleWithLessons) {
  return `Module ${module.position}: ${module.title}`;
}

function assignmentBelongsToModule(assignment: Assignment, module: ModuleWithLessons) {
  return assignment.description.startsWith(getModulePrefix(module));
}

function stripModulePrefix(description: string) {
  const separator = "\n\n";
  return description.includes(separator) ? description.split(separator).slice(1).join(separator) : description;
}

function toDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function InstructorCourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [slideForms, setSlideForms] = useState<Record<number, SlideFormState>>({});
  const [assignmentForms, setAssignmentForms] = useState<Record<number, AssignmentFormState>>({});
  const [editingSlide, setEditingSlide] = useState<Lesson | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCourse = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const [courseData, contentData, assignmentData] = await Promise.all([
        fetchCourse(id),
        fetchCourseContent(id),
        fetchCourseAssignments(id)
      ]);
      setCourse(courseData);
      setModules(contentData);
      setAssignments(assignmentData);
      setActiveModuleId((current) => current ?? contentData[0]?.id ?? null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load course."));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  const activeModule = useMemo(
    () => modules.find((module) => module.id === activeModuleId) ?? modules[0] ?? null,
    [activeModuleId, modules]
  );

  function getSlideForm(moduleId: number) {
    return slideForms[moduleId] ?? emptySlideForm;
  }

  function getAssignmentForm(moduleId: number) {
    return assignmentForms[moduleId] ?? emptyAssignmentForm;
  }

  function updateSlideForm(moduleId: number, values: Partial<SlideFormState>) {
    setSlideForms((current) => ({
      ...current,
      [moduleId]: { ...getSlideForm(moduleId), ...values }
    }));
  }

  function updateAssignmentForm(moduleId: number, values: Partial<AssignmentFormState>) {
    setAssignmentForms((current) => ({
      ...current,
      [moduleId]: { ...getAssignmentForm(moduleId), ...values }
    }));
  }

  function startEditSlide(module: ModuleWithLessons, slide: Lesson) {
    setEditingSlide(slide);
    updateSlideForm(module.id, {
      title: slide.title.replace(`${SLIDE_PREFIX} `, ""),
      content: slide.content
    });
  }

  function startEditAssignment(module: ModuleWithLessons, assignment: Assignment) {
    setEditingAssignment(assignment);
    updateAssignmentForm(module.id, {
      title: assignment.title,
      description: stripModulePrefix(assignment.description),
      dueDate: toDateTimeInput(assignment.due_date),
      maxPoints: String(assignment.max_points)
    });
  }

  async function handleSlideSubmit(event: FormEvent<HTMLFormElement>, module: ModuleWithLessons) {
    event.preventDefault();
    const form = getSlideForm(module.id);
    const payload: LessonPayload = {
      title: `${SLIDE_PREFIX} ${form.title}`,
      content: form.content,
      position: editingSlide?.module_id === module.id ? editingSlide.position : module.lessons.length + 1
    };

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (editingSlide?.module_id === module.id) {
        await updateLesson(editingSlide.id, payload);
        setSuccess("Lecture slide updated.");
      } else {
        await createLesson(module.id, payload);
        setSuccess("Lecture slide added.");
      }
      setEditingSlide(null);
      updateSlideForm(module.id, emptySlideForm);
      await loadCourse();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not save lecture slide."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSlide(slideId: number) {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await deleteLesson(slideId);
      setSuccess("Lecture slide removed.");
      await loadCourse();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Could not remove lecture slide."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssignmentSubmit(event: FormEvent<HTMLFormElement>, module: ModuleWithLessons) {
    event.preventDefault();
    const form = getAssignmentForm(module.id);
    const payload: AssignmentPayload = {
      title: form.title,
      description: `${getModulePrefix(module)}\n\n${form.description}`.trim(),
      due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      max_points: Number(form.maxPoints)
    };

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (editingAssignment && assignmentBelongsToModule(editingAssignment, module)) {
        await updateAssignment(editingAssignment.id, payload);
        setSuccess("Assignment updated.");
      } else {
        await createAssignment(module.course_id, payload);
        setSuccess("Assignment created.");
      }
      setEditingAssignment(null);
      updateAssignmentForm(module.id, emptyAssignmentForm);
      await loadCourse();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not save assignment."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAssignment(assignmentId: number) {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await deleteAssignment(assignmentId);
      setSuccess("Assignment deleted.");
      await loadCourse();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Could not delete assignment."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={course?.title ?? "Instructor Course Detail"}
        description="Manage modules, lecture slides, and assignments from one course workspace."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        {isLoading ? <MessageBox>Loading course...</MessageBox> : null}

        {course ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-950">{course.title}</h2>
                  <CourseStatusBadge status={course.status} />
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {course.description || "No description provided."}
                </p>
              </div>
              <Link
                to={`/instructor/courses/${course.id}/builder`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Edit module order
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoading && modules.length === 0 ? (
          <MessageBox>No modules yet. Open the builder to add modules first.</MessageBox>
        ) : null}

        {modules.length > 0 && activeModule ? (
          <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="px-2 text-sm font-bold uppercase tracking-wide text-slate-500">Modules</h2>
              <div className="mt-4 space-y-2">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => setActiveModuleId(module.id)}
                    className={[
                      "w-full rounded-xl px-4 py-3 text-left text-sm transition",
                      activeModule.id === module.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    ].join(" ")}
                  >
                    <span className="block text-xs font-semibold uppercase opacity-75">Module {module.position}</span>
                    <span className="mt-1 block font-bold">{module.title}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Module {activeModule.position}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">{activeModule.title}</h2>
              </div>

              <LectureSlidesSection
                module={activeModule}
                form={getSlideForm(activeModule.id)}
                editingSlide={editingSlide?.module_id === activeModule.id ? editingSlide : null}
                isSubmitting={isSubmitting}
                onChange={(values) => updateSlideForm(activeModule.id, values)}
                onSubmit={(event) => void handleSlideSubmit(event, activeModule)}
                onEdit={(slide) => startEditSlide(activeModule, slide)}
                onDelete={(slideId) => void handleDeleteSlide(slideId)}
                onCancel={() => {
                  setEditingSlide(null);
                  updateSlideForm(activeModule.id, emptySlideForm);
                }}
              />

              <AssignmentsSection
                module={activeModule}
                assignments={assignments.filter((assignment) => assignmentBelongsToModule(assignment, activeModule))}
                form={getAssignmentForm(activeModule.id)}
                editingAssignment={
                  editingAssignment && assignmentBelongsToModule(editingAssignment, activeModule)
                    ? editingAssignment
                    : null
                }
                isSubmitting={isSubmitting}
                onChange={(values) => updateAssignmentForm(activeModule.id, values)}
                onSubmit={(event) => void handleAssignmentSubmit(event, activeModule)}
                onEdit={(assignment) => startEditAssignment(activeModule, assignment)}
                onDelete={(assignmentId) => void handleDeleteAssignment(assignmentId)}
                onCancel={() => {
                  setEditingAssignment(null);
                  updateAssignmentForm(activeModule.id, emptyAssignmentForm);
                }}
              />
            </section>
          </div>
        ) : null}
      </div>
    </>
  );
}

type LectureSlidesSectionProps = {
  module: ModuleWithLessons;
  form: SlideFormState;
  editingSlide: Lesson | null;
  isSubmitting: boolean;
  onChange: (values: Partial<SlideFormState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEdit: (slide: Lesson) => void;
  onDelete: (slideId: number) => void;
  onCancel: () => void;
};

function LectureSlidesSection({
  module,
  form,
  editingSlide,
  isSubmitting,
  onChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancel
}: LectureSlidesSectionProps) {
  const slides = module.lessons.filter((lesson) => lesson.title.startsWith(SLIDE_PREFIX));

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Lecture slides</h2>
      </div>
      <div className="space-y-4 p-5">
        {slides.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No lecture slides added for this module.
          </p>
        ) : (
          slides.map((slide) => (
            <article key={slide.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-bold text-slate-950">{slide.title.replace(`${SLIDE_PREFIX} `, "")}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {slide.content || "No slide link or notes provided."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(slide)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(slide.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))
        )}

        <form className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4" onSubmit={onSubmit}>
          <h3 className="text-sm font-bold text-slate-950">
            {editingSlide ? "Edit lecture slide" : "Add lecture slide"}
          </h3>
          <input
            value={form.title}
            onChange={(event) => onChange({ title: event.target.value })}
            required
            minLength={2}
            placeholder="Slide title"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <textarea
            value={form.content}
            onChange={(event) => onChange({ content: event.target.value })}
            rows={3}
            placeholder="Slide link, lecture notes, or reference"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : editingSlide ? "Update slide" : "Add slide"}
            </button>
            {editingSlide ? (
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
      </div>
    </section>
  );
}

type AssignmentsSectionProps = {
  module: ModuleWithLessons;
  assignments: Assignment[];
  form: AssignmentFormState;
  editingAssignment: Assignment | null;
  isSubmitting: boolean;
  onChange: (values: Partial<AssignmentFormState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignmentId: number) => void;
  onCancel: () => void;
};

function AssignmentsSection({
  assignments,
  form,
  editingAssignment,
  isSubmitting,
  onChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancel
}: AssignmentsSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Assignments</h2>
      </div>
      <div className="space-y-4 p-5">
        {assignments.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No assignments created for this module.
          </p>
        ) : (
          assignments.map((assignment) => (
            <article key={assignment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-bold text-slate-950">{assignment.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {stripModulePrefix(assignment.description) || "No instructions provided."}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {formatDate(assignment.due_date)} - {assignment.max_points} points
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(assignment)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(assignment.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}

        <form className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4" onSubmit={onSubmit}>
          <h3 className="text-sm font-bold text-slate-950">
            {editingAssignment ? "Edit assignment" : "Create assignment"}
          </h3>
          <div className="grid gap-3 md:grid-cols-[1fr_160px]">
            <input
              value={form.title}
              onChange={(event) => onChange({ title: event.target.value })}
              required
              minLength={3}
              placeholder="Assignment title"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <input
              type="number"
              min={1}
              value={form.maxPoints}
              onChange={(event) => onChange({ maxPoints: event.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={(event) => onChange({ dueDate: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <textarea
            value={form.description}
            onChange={(event) => onChange({ description: event.target.value })}
            rows={3}
            placeholder="Assignment instructions"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : editingAssignment ? "Update assignment" : "Create assignment"}
            </button>
            {editingAssignment ? (
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
      </div>
    </section>
  );
}
