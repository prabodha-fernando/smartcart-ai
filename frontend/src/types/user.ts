export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: number | string;
  name: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phone: string;
  username: string;
  image: string;
  role: string;

  // Optional profile extras. The backend's /auth/me returns the core fields
  // above; these richer fields only exist on the legacy DummyJSON profile (or
  // once a user fills them in), so consumers must treat them as optional.
  maidenName?: string;
  age?: number;
  birthDate?: string;
  university?: string;

  address?: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  company?: {
    department: string;
    name: string;
    title: string;
  };
}

export interface UsersResponse {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreateAccountPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthApiUser {
  id: string;
  name?: string;
  email: string;
}

export interface AuthApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthApiData {
  user: AuthApiUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
