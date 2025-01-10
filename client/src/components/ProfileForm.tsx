import { useState } from "react";
import { useForm } from "react-hook-form";
import { User } from "@db/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface ProfileFormProps {
  user: User;
  onSubmit: (data: any) => void;
}

export function ProfileForm({ user, onSubmit }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: user });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-24 w-24">
          <div className="bg-primary/10 w-full h-full flex items-center justify-center">
            {user.username[0].toUpperCase()}
          </div>
        </Avatar>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            placeholder="Username"
            {...register("username", { required: "Username is required" })}
          />
          {errors.username && (
            <p className="text-sm text-destructive mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <Input
            type="email"
            placeholder="Email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full">
          Update Profile
        </Button>
      </div>
    </form>
  );
}
