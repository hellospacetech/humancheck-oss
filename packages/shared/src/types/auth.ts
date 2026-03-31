export enum UserRole {
  CLIENT = "CLIENT",
  TESTER = "TESTER",
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}
