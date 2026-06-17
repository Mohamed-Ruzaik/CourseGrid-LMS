import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  fetchCourseContent,
  updateLesson,
  updateModule
} from "../../api/content";
import { fetchCourse } from "../../api/courses";
import { LessonForm, ModuleForm } from "../../components/ContentForms";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Lesson, LessonPayload, ModulePayload, ModuleWithLessons, CourseModule } from "../../types/content";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function InstructorCourseBuilderPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBuilder = useCallback(async () => {
    if (!id) {
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const [courseData, contentData] = await Promise.all([
        fetchCourse(id),
        fetchCourseContent(id)
      ]);
      setCourse(courseData);
      setModules(contentData);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load course builder."));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadBuilder();
  }, [loadBuilder]);

  async function handleModuleSubmit(payload: ModulePayload) {
    if (!id) {
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (editingModule) {
        await updateModule(editingModule.id, payload);
        setSuccess("Module updated.");
      } else {
        await createModule(id, payload);
        setSuccess("Module added.");
      }
      setEditingModule(null);
      await loadBuilder();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not save module."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLessonSubmit(moduleId: number, payload: LessonPayload) {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, payload);
        setSuccess("Lesson updated.");
      } else {
        await createLesson(moduleId, payload);
        setSuccess("Lesson added.");
      }
      setEditingLesson(null);
      await loadBuilder();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not save lesson."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteModule(moduleId: number) {
    setError("");
    setSuccess("");
    try {
      await deleteModule(moduleId);
      setSuccess("Module deleted.");
      await loadBuilder();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Could not delete module."));
    }
  }

  async function handleDeleteLesson(lessonId: number) {
    setError("");
    setSuccess("");
    try {
      await deleteLesson(lessonId);
      setSuccess("Lesson deleted.");
      await loadBuilder();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Could not delete lesson."));
    }
  }

  return (
    <>
      <PageHeader
        title={course ? `${course.title} Builder` : "Course Builder"}
        description="Build ordered modules and lessons with simple position numbers."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        <ModuleForm
          module={editingModule}
          isSubmitting={isSubmitting}
          onSubmit={handleModuleSubmit}
          onCancel={editingModule ? () => setEditingModule(null) : undefined}
        />
        {isLoading ? <MessageBox>Loading builder...</MessageBox> : null}
        {!isLoading && modules.length === 0 ? (
          <MessageBox>No modules yet. Add the first module above.</MessageBox>
        ) : null}
        <div className="space-y-4">
          {modules.map((module) => (
            <section key={module.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Module {module.position}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{module.title}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingModule(module)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit module
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteModule(module.id)}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete module
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {module.lessons.length === 0 ? (
                  <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    No lessons in this module yet.
                  </p>
                ) : (
                  module.lessons.map((lesson) => (
                    <article key={lesson.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Lesson {lesson.position}
                          </p>
                          <h3 className="mt-1 font-semibold text-slate-950">{lesson.title}</h3>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {lesson.content || "No content provided."}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingLesson(lesson)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteLesson(lesson.id)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
                <LessonForm
                  moduleId={module.id}
                  lesson={editingLesson?.module_id === module.id ? editingLesson : null}
                  isSubmitting={isSubmitting}
                  onSubmit={handleLessonSubmit}
                  onCancel={editingLesson?.module_id === module.id ? () => setEditingLesson(null) : undefined}
                />
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
