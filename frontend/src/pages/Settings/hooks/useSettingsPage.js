import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../../../api/auth';
import { useCurrentUser, useCurrentUserRole } from '../../../hooks/useUsers';

export function useSettingsPage() {
  const currentUser = useCurrentUser();
  const actorRole   = useCurrentUserRole();

  // ── Profile form ────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentUser?.email ?? '');

  useEffect(() => {
    if (currentUser?.email) {
      setEmail(prev =>
        prev === currentUser.email ? prev : currentUser.email
      );
    }
  }, [currentUser?.email]);

  // ── Password form ────────────────────────────────────────────────────────────
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => authApi.updateUser(currentUser?.id, data),
    onSuccess: () => {
      setSaveSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSave = () => {
    if (!currentUser) return;

    setPasswordError('');
    const payload = {};

    if (email.trim() && email !== currentUser.email) {
      payload.email = email.trim();
    }

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      payload.password = newPassword;
    }

    if (Object.keys(payload).length === 0) return;

    updateMutation.mutate(payload);
  };

  return {
    actorRole,
    currentUser,

    name, setName,
    email, setEmail,

    oldPassword, setOldPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,

    showOld, setShowOld,
    showNew, setShowNew,
    showConfirm, setShowConfirm,

    passwordError,

    handleSave,
    isSaving: updateMutation.isPending,
    saveSuccess,
    saveError: updateMutation.error,
  };
}