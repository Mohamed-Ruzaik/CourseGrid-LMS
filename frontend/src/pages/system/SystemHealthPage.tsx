import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";

type EndpointStatus = {
  label: string;
  value: string;
  ok: boolean;
  detail: string;
};

type VersionState = {
  name: string;
  version: string;
  environment: string;
};

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex h-2.5 w-2.5 rounded-full ${
        ok ? "bg-emerald-500" : "bg-red-500"
      }`}
      aria-hidden="true"
    />
  );
}

export function SystemHealthPage() {
  const [statuses, setStatuses] = useState<EndpointStatus[]>([]);
  const [version, setVersion] = useState<VersionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSystem() {
      setIsLoading(true);
      const [health, ready, versionResponse] = await Promise.allSettled([
        apiClient.get("/health"),
        apiClient.get("/ready"),
        apiClient.get("/version")
      ]);

      const healthOk = health.status === "fulfilled" && health.value.data.status === "ok";
      const readyOk = ready.status === "fulfilled" && ready.value.data.status === "ready";

      setStatuses([
        {
          label: "API status",
          value: healthOk ? "Healthy" : "Unavailable",
          ok: healthOk,
          detail: "/health"
        },
        {
          label: "Database readiness",
          value: readyOk ? "Ready" : "Not ready",
          ok: readyOk,
          detail:
            ready.status === "fulfilled"
              ? `database: ${ready.value.data.database ?? "unknown"}`
              : "/ready unavailable"
        }
      ]);

      setVersion(
        versionResponse.status === "fulfilled"
          ? {
              name: versionResponse.value.data.name,
              version: versionResponse.value.data.version,
              environment: versionResponse.value.data.environment
            }
          : null
      );
      setIsLoading(false);
    }

    void checkSystem();
  }, []);

  return (
    <>
      <PageHeader
        title="System Health"
        description="Runtime checks for the FastAPI service, database readiness, and app version."
      />
      <div className="space-y-5 p-6">
        {isLoading ? <MessageBox>Checking backend health...</MessageBox> : null}
        <div className="grid gap-4 md:grid-cols-3">
          {statuses.map((status) => (
            <div key={status.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <StatusDot ok={status.ok} />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {status.label}
                </p>
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-950">{status.value}</p>
              <p className="mt-1 text-sm text-slate-500">{status.detail}</p>
            </div>
          ))}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <StatusDot ok={Boolean(version)} />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                App version
              </p>
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {version ? `${version.name} ${version.version}` : "Unavailable"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {version ? version.environment : "/version unavailable"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
