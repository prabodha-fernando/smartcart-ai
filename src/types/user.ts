export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  maidenName: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  username: string;
  birthDate: string;
  image: string;
  university: string;
  role: string;

  address: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  company: {
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
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  age: number;
}
