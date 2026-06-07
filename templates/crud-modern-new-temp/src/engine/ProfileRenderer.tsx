import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, KeyRound, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/core/auth/auth.context";
import { changePassword, updateProfile } from "@/lib/auth";
import { config } from "@/lib/config";
import { initials } from "@/lib/utils";
import { notify } from "@/lib/toast";

export function ProfileRenderer() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setAvatarUrl(user?.avatarUrl ?? "");
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, avatarUrl });
      await refresh();
      notify.updated("Profile");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!password) return;
    setChangingPassword(true);
    try {
      await changePassword(password);
      setPassword("");
      notify.success("Password updated");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Password update failed");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-2xl space-y-4"
    >
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 border-b border-border/60 bg-muted/30 px-8 py-6">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover shadow-lg ring-4 ring-background" />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-primary-foreground shadow-lg ring-4 ring-background"
              style={{ background: "var(--primary-gradient, var(--primary))" }}
            >
              {initials(user.name || user.email)}
            </div>
          )}
          <div>
            <CardTitle className="text-lg">{user.name || user.email}</CardTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.roleName && <p className="mt-1 text-xs text-primary">{user.roleName}</p>}
          </div>
        </CardHeader>
        <CardContent className="space-y-5 px-8 py-6">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-avatar">Profile Photo URL</Label>
            <Input id="profile-avatar" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user.email} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-role">Role</Label>
            <Input id="profile-role" value={user.roleName ?? ""} disabled />
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="text-primary-foreground" style={{ background: "var(--primary)" }}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="profile-password">New Password</Label>
            <Input
              id="profile-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={savePassword} disabled={changingPassword || !password}>
              {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Support</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>{config.company.name}</p>
          {config.support.email && <p>{config.support.email}</p>}
          {config.support.phone && <p>{config.support.phone}</p>}
          {config.support.helpUrl && <p>{config.support.helpUrl}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
