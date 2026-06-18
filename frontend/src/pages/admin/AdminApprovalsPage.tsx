import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import {
  approveInstructorCourseRequest,
  approveUser,
  fetchApprovals,
  rejectInstructorCourseRequest
} from "../../api/approvals";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { ApprovalSummary } from "../../types/approval";
import { getApiErrorMessage } from "../../utils/errorMessage";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AdminApprovalsPage() {
  const [summary, setSummary] = useState<ApprovalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workingKey, setWorkingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pendingUsers = useMemo(
    () => summary?.users.filter((user) => !user.is_active) ?? [],
    [summary]
  );
  const pendingRequests = useMemo(
    () => summary?.instructor_course_requests.filter((request) => request.status === "pending") ?? [],
    [summary]
  );

  const loadApprovals = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setSummary(await fetchApprovals());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load approvals."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApprovals();
  }, [loadApprovals]);

  async function runAction(key: string, action: () => Promise<unknown>, message: string) {
    setWorkingKey(key);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      await loadApprovals();
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Action failed."));
    } finally {
      setWorkingKey("");
    }
  }

  return (
    <>
      <PageHeader title="Approvals" description="Review pending account and course access requests." />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Account approvals</h2>
              <p className="text-sm text-slate-500">{pendingUsers.length} pending or suspended accounts</p>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-5 text-sm text-slate-600">Loading account approvals...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No account approvals pending.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-950">{user.name}</p>
                        <p className="mt-1 text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-4 capitalize text-slate-700">{user.role}</td>
                      <td className="px-4 py-4 text-slate-500">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(`approve-user-${user.id}`, () => approveUser(user.id), `${user.name} approved.`)
                          }
                          disabled={workingKey === `approve-user-${user.id}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Instructor course approvals</h2>
              <p className="text-sm text-slate-500">{pendingRequests.length} pending course access requests</p>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-5 text-sm text-slate-600">Loading course approvals...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No course approvals pending.</p>
          ) : (
            <div className="mt-5 grid gap-3">
              {pendingRequests.map((request) => (
                <article key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-950">{request.course_title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {request.instructor_name} · {request.instructor_email}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Requested {formatDate(request.requested_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            `approve-request-${request.id}`,
                            () => approveInstructorCourseRequest(request.id),
                            "Instructor course request approved."
                          )
                        }
                        disabled={workingKey === `approve-request-${request.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            `reject-request-${request.id}`,
                            () => rejectInstructorCourseRequest(request.id),
                            "Instructor course request rejected."
                          )
                        }
                        disabled={workingKey === `reject-request-${request.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
