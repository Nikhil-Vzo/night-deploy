import * as React from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/supabase";

export default function AuthForm() {
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize the navigate function
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ email: "", password: "" });

  async function handleSignIn() {
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(form);
      if (error) {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Signed in successfully" });
        // --- THIS IS THE FIX ---
        // On success, navigate to the profile page
        navigate("/profile");
        // -----------------------
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp(form);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "Please check your email to confirm your account." });
        // --- THIS IS THE FIX ---
        // On success, navigate to the profile page
        navigate("/profile");
        // -----------------------
      }
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = mode === "signin" ? handleSignIn : handleSignUp;

  return (
    <Card className="w-full max-w-sm border-0 bg-white/80 shadow-sm">
      <CardHeader>
        <CardTitle>{mode === "signin" ? "Sign In" : "Create Account"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="m@example.com"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Password</label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </div>
        <Button onClick={onSubmit} disabled={loading} className="w-full rounded-full">
          {loading ? "Working..." : (mode === "signin" ? "Sign In" : "Create Account")}
        </Button>
        <div className="mt-4 text-center text-sm">
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => setMode("signup")} className="underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="underline">
                Sign in
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}