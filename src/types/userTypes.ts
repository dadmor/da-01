export type Identity = {
  id: string;
};

export interface UserData {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  user_metadata?: {
    role?: string;
    email?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    sub?: string;
    [key: string]: any;
  };
  [key: string]: any;
}