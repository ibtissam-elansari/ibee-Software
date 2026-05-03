import React from 'react'
import StatusCard from './components/StatusCard'
import { useDashboardStats } from '../../../hooks/useDashboardStats'
import { ChevronRight } from 'lucide-react'

const HoneyIcon = () => (
  <svg width="43" height="43" viewBox="0 0 43 43" fill="none">
    <rect width="42.6122" height="42.6122" rx="4" fill="#EAB308" fillOpacity="0.1"/>
    <path d="M11.5212 21.3061L14.0225 16.9719H19.0279L21.5297 21.3061L19.0273 25.6403H14.022L11.5212 21.3061ZM21.0823 26.826L23.5831 22.4918H28.5884L31.0908 26.826L28.5884 31.1602H23.5831L21.0823 26.826ZM21.0823 15.7863L23.5826 11.4521H28.5879L31.0903 15.7863L28.5879 20.1204H23.5826L21.0823 15.7863Z" fill="#E9A929"/>
  </svg>
)

const StateIcon = ({ urgent }) => (
  <svg width="43" height="43" viewBox="0 0 43 43" fill="none">
    <rect width="42.6122" height="42.6122" rx="4" fill="#2F9D4A" fillOpacity="0.1"/>
    <g clipPath="url(#clip-state)">
      <path d="M30.2834 17.7403C29.8927 17.29 29.4097 16.9289 28.8672 16.6814C28.3248 16.434 27.7355 16.306 27.1393 16.3061H23.8151L24.0951 14.6053C24.1942 14.0064 24.0746 13.3917 23.7583 12.8736C23.442 12.3554 22.9499 11.9682 22.3719 11.7826C21.7939 11.597 21.1684 11.6254 20.6096 11.8625C20.0507 12.0997 19.5957 12.5298 19.3276 13.0745L17.9726 15.8203V28.8061H26.5559C27.5588 28.802 28.5269 28.4381 29.2841 27.7804C30.0413 27.1228 30.5372 26.2152 30.6818 25.2228L31.2693 21.0561C31.3523 20.4651 31.3073 19.8631 31.1372 19.2909C30.9671 18.7188 30.6759 18.19 30.2834 17.7403Z" fill={urgent ? "#EF4444" : "#2F9D4A"}/>
      <path d="M11.306 20.4729V24.6395C11.3073 25.7442 11.7467 26.8032 12.5278 27.5844C13.3089 28.3655 14.368 28.8049 15.4726 28.8062H16.306V16.3062H15.4726C14.368 16.3075 13.3089 16.7469 12.5278 17.5281C11.7467 18.3092 11.3073 19.3682 11.306 20.4729Z" fill={urgent ? "#EF4444" : "#2F9D4A"}/>
    </g>
    <defs>
      <clipPath id="clip-state">
        <rect width="20" height="20" fill="white" transform="translate(11.306 11.3061)"/>
      </clipPath>
    </defs>
  </svg>
)

const Urgent = () => (
  <svg width="43" height="43" viewBox="0 0 43 43" fill="none">
    <circle cx="21.0225" cy="21.0225" r="12.5" fill="white"/>
    <circle cx="21.0225" cy="21.0225" r="4.5" fill="#DC2626"/>
  </svg>
)

const SecurityIcon = () => (
  <svg width="43" height="43" viewBox="0 0 43 43" fill="none">
    <rect width="42.6122" height="42.6122" rx="4.26122" fill="#1D5FCA" fillOpacity="0.1"/>
    <g clipPath="url(#clip-sec)">
      <path d="M14.3059 24.3061C14.3059 20.4401 17.4399 17.3061 21.3059 17.3061C25.1719 17.3061 28.3059 20.4401 28.3059 24.3061C28.3059 28.1721 25.1719 31.3061 21.3059 31.3061C17.4399 31.3061 14.3059 28.1721 14.3059 24.3061Z" fill="#1D5FCA" stroke="#1D5FCA" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M25.8059 18.8061V15.8061C25.8059 13.3209 23.7912 11.3061 21.3059 11.3061C18.8206 11.3061 16.8059 13.3209 16.8059 15.8061V18.8061" stroke="#1D5FCA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21.3059 25.3061V23.3061" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <defs>
      <clipPath id="clip-sec">
        <rect width="25.5673" height="25.5673" fill="white" transform="translate(8.52234 8.52246)"/>
      </clipPath>
    </defs>
  </svg>
)

const StatusField = () => {
  const {
    isLoading,
    totalHives,
    hasUrgent,
    alertCount,
    secureCount,
    doorOpenCount,
    totalWithData,
    openHives,      // ← array of hive objects where door_open === true
  } = useDashboardStats()

  const cards = [
    {
      label    : 'Etat',
      state    : 'Ruches actives',
      title    : isLoading ? null : `${totalHives}/${totalHives}`,
      subTitle : isLoading ? '...' : `${totalHives} ruche${totalHives > 1 ? 's' : ''} active${totalHives > 1 ? 's' : ''}`,
      icon     : <HoneyIcon />,
      isLoading,
    },
    {
      label      : 'Etat',
      state      : hasUrgent ? 'Urgent' : 'Normale',
      stateColor : hasUrgent ? 'text-red-500' : 'text-green-600',
      title      : hasUrgent ? `${alertCount} alerte${alertCount > 1 ? 's' : ''}` : 'Aucun problème',
      subTitle   : hasUrgent
        ? `${alertCount} ruche${alertCount > 1 ? 's' : ''} nécessite${alertCount > 1 ? 'nt' : ''} attention`
        : 'Toutes les ruches sont parfaites',
      icon     : hasUrgent ? <Urgent /> : <StateIcon />,
      urgent   : hasUrgent,
      isLoading,
    },
    {
      label      : 'Etat',
      state      : 'Sécurité',
      stateColor : 'text-blue-600',
      title      : isLoading ? null : `${secureCount}/${totalWithData || totalHives}`,
      subTitle   : doorOpenCount > 0
        ? `${doorOpenCount} ruche${doorOpenCount > 1 ? 's' : ''} ouverte${doorOpenCount > 1 ? 's' : ''}`
        : 'Toutes les ruches sont fermées',
      icon      : <SecurityIcon />,
      isLoading,
      // Only pass openHives when there are actually open hives — the card
      // renders the chevron + popover automatically when this is non-empty
      openHives : doorOpenCount > 0 ? openHives : [],
    },
  ]

  return (
    <div className="flex flex-col gap-y-4 p-4 bg-base-100 rounded-2xl overflow-hidden w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <StatusCard key={i} card={card} />
        ))}
      </div>
    </div>
  )
}

export default StatusField