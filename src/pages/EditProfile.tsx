import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { pb } from "@/lib/pocketbase";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  about: z.string().max(500, "About me must be 500 characters or less").optional(),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    password: z.string().min(8, "New password must be at least 8 characters"),
    passwordConfirm: z.string().min(8, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function EditProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: userData } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      return await pb.collection("users").getOne(user!.id);
    },
    enabled: !!user,
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: userData?.name || "",
      about: userData?.about || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues & { avatar?: File }) => {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.about) formData.append("about", data.about);
      if (data.avatar) formData.append("avatar", data.avatar);

      return await pb.collection("users").update(user!.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", user?.id] });
      setSuccessMessage("Profile updated successfully!");
      setProfileError(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error: any) => {
      setProfileError(error.message || "Failed to update profile");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      return await pb.collection("users").update(user!.id, {
        oldPassword: data.oldPassword,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
      });
    },
    onSuccess: () => {
      setSuccessMessage("Password changed successfully!");
      setPasswordError(null);
      passwordForm.reset();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error: any) => {
      setPasswordError(error.message || "Failed to change password");
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate({ ...data, avatar: avatarFile || undefined });
  };

  const handlePasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-500 rounded-md text-green-800 dark:text-green-200">
          {successMessage}
        </div>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your name, avatar, and bio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : userData?.avatar ? (
                    <img
                      src={`http://127.0.0.1:8090/api/files/users/${userData.id}/${userData.avatar}`}
                      alt="Current avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{userData?.name?.[0] || "?"}</span>
                  )}
                </div>
                <Input type="file" accept="image/*" onChange={handleAvatarChange} />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...profileForm.register("name")} />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-red-500">{profileForm.formState.errors.name.message}</p>
              )}
            </div>

            {/* About Me */}
            <div className="space-y-2">
              <Label htmlFor="about">About Me</Label>
              <Textarea
                id="about"
                placeholder="Tell us about yourself..."
                className="min-h-[100px]"
                {...profileForm.register("about")}
              />
              {profileForm.formState.errors.about && (
                <p className="text-sm text-red-500">{profileForm.formState.errors.about.message}</p>
              )}
            </div>

            {profileError && <p className="text-sm text-red-500">{profileError}</p>}

            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Current Password</Label>
              <Input id="oldPassword" type="password" {...passwordForm.register("oldPassword")} />
              {passwordForm.formState.errors.oldPassword && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.oldPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" {...passwordForm.register("password")} />
              {passwordForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirm New Password</Label>
              <Input
                id="passwordConfirm"
                type="password"
                {...passwordForm.register("passwordConfirm")}
              />
              {passwordForm.formState.errors.passwordConfirm && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.passwordConfirm.message}
                </p>
              )}
            </div>

            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}

            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => navigate(`/profile/${user.id}`)}>
        Back to Profile
      </Button>
    </div>
  );
}
