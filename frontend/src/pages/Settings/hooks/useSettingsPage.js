import { useState, useEffect } from 'react';
import { useMe, useUpdateMe } from '../../../hooks/useMe';
import { useCurrentUserRole } from '../../../hooks/useUsers';

export function useSettingsPage() {
  const { data: me, isLoading: loadingMe } = useMe();
  const actorRole = useCurrentUserRole();
  const {
    mutate: updateMe,
    isPending: isSaving,
    error: saveError,
    isSuccess: saveSuccess,
    reset: resetMutation,
  } = useUpdateMe();

  // Auth fields
  const [email,           setEmail]           = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [passwordError,   setPasswordError]   = useState('');

  // Profile fields (new)
  const [fullName,  setFullName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [location,  setLocation]  = useState('');

  // Sync all fields when `me` loads or changes
  useEffect(() => {
    if (!me) return;
    setEmail(me.email       ?? '');
    setFullName(me.full_name ?? '');
    setPhone(me.phone        ?? '');
    setLocation(me.location  ?? '');
  }, [me?.email, me?.full_name, me?.phone, me?.location]);

  const handleSave = () => {
    setPasswordError('');
    resetMutation();
    if (!me?.id) return;

    const payload = {};

    // Auth changes
    if (email.trim() && email.trim() !== me.email) payload.email = email.trim();
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

    // Profile changes — send null to clear, send new value if changed
    if (fullName.trim() !== (me.full_name ?? '')) {
      payload.full_name = fullName.trim() || null;
    }
    if (phone.trim() !== (me.phone ?? '')) {
      payload.phone = phone.trim() || null;
    }
    if (location.trim() !== (me.location ?? '')) {
      payload.location = location.trim() || null;
    }

    if (Object.keys(payload).length === 0) return;

    updateMe(
      { id: me.id, data: payload },
      { onSuccess: () => { setNewPassword(''); setConfirmPassword(''); } },
    );
  };

  return {
    me, loadingMe,
    actorRole: actorRole ?? me?.role,

    // Auth
    email, setEmail,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showNew, setShowNew,
    showConfirm, setShowConfirm,
    passwordError,

    // Profile
    fullName, setFullName,
    phone, setPhone,
    location, setLocation,

    // Submit
    handleSave, isSaving, saveSuccess, saveError,
  };
}