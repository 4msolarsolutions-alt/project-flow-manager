import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateProfile, type UserWithRoles } from "@/hooks/useUsers";
import { Loader2 } from "lucide-react";

interface UserStatusDialogProps {
  user: UserWithRoles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserStatusDialog({ user, open, onOpenChange }: UserStatusDialogProps) {
  const updateProfile = useUpdateProfile();

  if (!user) return null;

  const isActive = user.is_active ?? true;
  const action = isActive ? "deactivate" : "activate";

  const handleConfirm = async () => {
    await updateProfile.mutateAsync({
      userId: user.id,
      updates: { is_active: !isActive },
    });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? "Deactivate" : "Activate"} User
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {action}{" "}
            <span className="font-medium text-foreground">
              {user.first_name || user.email || "this user"}
            </span>
            ?
            {isActive
              ? " They will no longer be able to access the system."
              : " They will regain access to the system."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateProfile.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={updateProfile.isPending}
            className={isActive ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isActive ? "Deactivate" : "Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
