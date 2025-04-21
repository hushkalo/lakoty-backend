import { compare, genSalt, hash } from "bcrypt";

export async function hashPassword(password: string): Promise<string> {
  const salt = await genSalt(10);
  return hash(password, salt);
}

export async function comparePassword(params: {
  password: string;
  hashedPassword: string;
}): Promise<boolean> {
  return compare(params.password, params.hashedPassword);
}
