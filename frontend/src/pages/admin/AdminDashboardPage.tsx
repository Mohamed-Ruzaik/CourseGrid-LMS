import { useCallback, useEffect, useState } from "react";
import { fetchAnalyticsSummary } from "../../api/analytics";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import type { AnalyticsSummary } from "../../types/analytics";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function AdminDashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setSummary(await fetchAnalyticsSummary());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load analytics summary."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Global platform summary for users, courses, enrollments, assignments, and submissions."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {isLoading ? <MessageBox>Loading analytics summary...</MessageBox> : null}
        {summary ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Users" value={summary.total_users} />
            <StatCard label="Courses" value={summary.total_courses} />
            <StatCard label="Enrollments" value={summary.total_enrollments} />
            <StatCard label="Assignments" value={summary.total_assignments} />
            <StatCard label="Submissions" value={summary.total_submissions} />
            <StatCard
              label="Graded submissions"
              value={summary.total_graded_submissions}
              helper={
                summary.average_grade === null
                  ? "No grades recorded"
                  : `Average grade ${summary.average_grade}`
              }
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
