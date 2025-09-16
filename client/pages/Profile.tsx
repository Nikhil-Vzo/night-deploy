import * as React from "react";
import { useToast } from "@/components/ui/use-toast";
import { getSupabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthForm from "@/components/auth/AuthForm";
import { UserCircle2 } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // --- NEW: State for View/Edit mode ---
  const [isEditing, setIsEditing] = React.useState(false);

  const loadUser = React.useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return setLoading(false);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(p || { email: user.email, id: user.id });
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function handleSave() {
    const supabase = getSupabase();
    if (!supabase || !profile || !user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      ...profile,
      id: user.id,
      last_updated: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!" });
      setIsEditing(false); // Switch back to view mode after saving
    }
  }

  // --- NEW: Function to handle avatar upload ---
  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const supabase = getSupabase();
    if (!supabase || !user) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `public/${user.id}/${Date.now()}_${file.name}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        avatar_url: publicUrl,
      });
      
      if (updateError) throw updateError;
      
      setProfile({ ...profile, avatar_url: publicUrl });
      toast({ title: "Avatar updated!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="container py-10">Loading profile...</div>;
  }

  if (!user) {
    return <section className="container py-10 flex justify-center"><AuthForm /></section>;
  }

  return (
    <section className="container py-10 max-w-2xl">
      <Card className="border-0 bg-white/80 shadow-sm">
        <CardHeader className="text-center">
          {/* --- NEW: Avatar Display and Upload --- */}
          <div className="relative mx-auto w-24 h-24 mb-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserCircle2 className="w-full h-full text-gray-300" />
            )}
            <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-primary p-2 text-white shadow-md hover:bg-primary/90">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </label>
            <input id="avatar-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleAvatarUpload} disabled={uploading} />
          </div>
          <CardTitle className="text-2xl">{profile?.full_name || user.email}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid gap-4">
          {/* --- NEW: View / Edit Mode Logic --- */}
          {isEditing ? (
            <>
              {/* EDIT MODE */}
              <label className="grid gap-1 text-sm"><span className="font-medium">Full Name</span><Input value={profile?.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></label>
              <label className="grid gap-1 text-sm"><span className="font-medium">Email</span><Input value={user.email} disabled /></label>
              <label className="grid gap-1 text-sm"><span className="font-medium">Phone</span><Input value={profile?.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
              <label className="grid gap-1 text-sm"><span className="font-medium">City</span><Input value={profile?.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></label>
              <label className="grid gap-1 text-sm"><span className="font-medium">Education Level</span><Input value={profile?.education_level || ""} onChange={(e) => setProfile({ ...profile, education_level: e.target.value })} /></label>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setIsEditing(false); loadUser(); }} className="rounded-full">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="rounded-full">{saving ? "Saving..." : "Save Changes"}</Button>
              </div>
            </>
          ) : (
            <>
              {/* VIEW MODE */}
              <div className="text-sm space-y-4">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Full Name</span><span className="font-medium">{profile?.full_name || "Not set"}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Email</span><span className="font-medium">{user.email}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Phone</span><span className="font-medium">{profile?.phone || "Not set"}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">City</span><span className="font-medium">{profile?.city || "Not set"}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Education</span><span className="font-medium">{profile?.education_level || "Not set"}</span></div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsEditing(true)} className="rounded-full">Edit Profile</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}