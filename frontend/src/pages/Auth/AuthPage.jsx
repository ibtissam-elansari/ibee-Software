// src/pages/Auth/AuthPage.jsx
// Thin orchestrator — only manages which view is active.
import React, { useState } from 'react'
import LoginForm          from './components/LoginForm'
import ForgotPasswordForm from './components/ForgotPasswordForm'
import RegisterForm       from './components/RegisterForm'
import SupportModal       from './components/SupportModal'

const VIEWS = { LOGIN: 'login', FORGOT: 'forgot', REGISTER: 'register' }

const AuthPage = () => {
  const [view,         setView]         = useState(VIEWS.LOGIN)
  const [supportOpen,  setSupportOpen]  = useState(false)

  return (
    <>
      {view === VIEWS.LOGIN    && (
        <LoginForm
          onForgot   = {() => setView(VIEWS.FORGOT)}
          onRegister = {() => setView(VIEWS.REGISTER)}
          onSupport  = {() => setSupportOpen(true)}
        />
      )}
      {view === VIEWS.FORGOT   && <ForgotPasswordForm onBack={() => setView(VIEWS.LOGIN)} />}
      {view === VIEWS.REGISTER && <RegisterForm       onBack={() => setView(VIEWS.LOGIN)} />}

      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
    </>
  )
}

export default AuthPage