import { useState, useEffect } from 'react';
import { useMe, useUpdateMe } from '../../../hooks/useMe';
import { useCurrentUserRole } from '../../../hooks/useUsers';

export function useSettingsPage() {
  const { data: me, isLoading: loadingMe } = useMe();
  const actorRole = useCurrentUserRole();
  const { mutate: updateMe, isPending: isSaving, error: saveError, isSuccess: saveSuccess, reset: resetMutation } = useUpdateMe();

  const [email,           setEmail]           = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [passwordError,   setPasswordError]   = useState('');

  useEffect(() => {
    if (me?.email) setEmail(me.email);
  }, [me?.email]);

  const handleSave = () => {
    setPasswordError('');
    resetMutation();
    if (!me?.id) return;
    const payload = {};
    if (email.trim() && email.trim() !== me.email) payload.email = email.trim();
    if (newPassword) {
      if (newPassword !== confirmPassword) { setPasswordError('Les mots de passe ne correspondent pas.'); return; }
      if (newPassword.length < 6) { setPasswordError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
      payload.password = newPassword;
    }
    if (Object.keys(payload).length === 0) return;
    updateMe({ id: me.id, data: payload }, { onSuccess: () => { setNewPassword(''); setConfirmPassword(''); } });
  };

  return {
    me, loadingMe,
    actorRole: actorRole ?? me?.role,
    email, setEmail,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showNew, setShowNew,
    showConfirm, setShowConfirm,
    passwordError,
    handleSave, isSaving, saveSuccess, saveError,
  };
}