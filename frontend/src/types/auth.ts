export type UserRole = "admin" | "instructor" | "student";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  name: string;
  role: UserRole;
};

export type UpdateProfilePayload = {
  name: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};
