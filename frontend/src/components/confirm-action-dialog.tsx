import { useState, type JSX, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConfirmActionDialogProps {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  successMessage: string;
  onConfirm: () => Promise<unknown>;
  onDone: () => void;
}

/** Generic "are you sure" confirmation for a single async action — archive/restore/delete, wherever a click needs a confirm step first. */
export function ConfirmActionDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  successMessage,
  onConfirm,
  onDone,
}: ConfirmActionDialogProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm(): Promise<void> {
    setSubmitting(true);
    try {
      await onConfirm();
      toast.success(successMessage);
      onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={submitting}
            className={cn(destructive && buttonVariants({ variant: 'destructive' }))}
          >
            {submitting ? 'Working…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
