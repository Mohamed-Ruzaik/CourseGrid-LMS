import { PageScaffold } from "../PageScaffold";

export function AdminUsersPage() {
  return (
    <PageScaffold
      title="Admin Users"
      description="User management placeholder for the admin role."
      items={["List users", "Create users", "Edit role and active status"]}
    />
  );
}
