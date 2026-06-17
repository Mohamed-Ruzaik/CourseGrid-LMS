import { useCallback, useEffect, useState } from "react";
import { fetchAnalyticsSummary } from "../../api/analytics";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import type { AnalyticsSummary } from "../../types/analytics";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function InstructorDashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setSummary(await fetchAnalyticsSummary());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load instructor summary."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const ungradedCount = summary
    ? Math.max(summary.total_submissions - summary.total_graded_submissions, 0)
    : 0;

  return (
    <>
      <PageHeader
        title="Instructor Dashboard"
        description="Summary for your courses, assignments, submissions, and grading queue."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {isLoading ? <MessageBox>Loading instructor summary...</MessageBox> : null}
        {summary ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard label="My courses" value={summary.total_courses} />
            <StatCard label="Enrollments" value={summary.total_enrollments} />
            <StatCard label="Assignments" value={summary.total_assignments} />
            <StatCard label="Submissions" value={summary.total_submissions} />
            <StatCard label="Pending grading" value={ungradedCount} />
            <StatCard
              label="Graded submissions"
              value={summary.total_graded_submissions}
              helper={
                summary.average_grade === null
                  ? "No graded work yet"
                  : `Average grade ${summary.average_grade}`
              }
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
