import { supabase } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { UserProfile } from "@/types/domain";
import { profileFromRow, type ProfileRow } from "./users";
import type { Session } from "@supabase/supabase-js";

export async function signUp(email: string, password: string, name: string) {
  const res = await supabase.auth.signUp({ email, password, options: { data: { name } } });
  if (res.error) throw res.error;
  return res.data;
}
export async function signIn(email: string, password: string) {
  const res = await supabase.auth.signInWithPassword({ email, password });
  if (res.error) throw res.error;
  return res.data;
}
export async function signOut() {
  await supabase.auth.signOut();
}
export function onAuthChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
export async function changeMyPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
export async function getMyProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const res = await supabase.from("profiles").select("*").eq("id", user.id).single<ProfileRow>();
  if (res.error) throw res.error;
  return profileFromRow(res.data);
}
