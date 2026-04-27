import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Download, Calendar } from 'lucide-react';
import { Thermometer, Droplets, Volume2, Scale } from 'lucide-react';
import { useMetricDetail } from './hooks/useMetricDetail';
import MetricDetailChart from './components/MetricDetailChart';

const METRIC_UI = {
  temperature: {
    title    : 'Détails : Variation Température',
    subtitle : 'Analyse détaillée des relevés de température sur la période sélectionnée',
    unit     : '°C',
    AvgIcon  : Thermometer, avgIconBg: 'bg-orange-50', avgIconColor: '#D97706',
    MaxIcon  : Thermometer, maxIconBg: 'bg-red-50',    maxIconColor: '#EF4444',
    MinIcon  : Thermometer, minIconBg: 'bg-blue-50',   minIconColor: '#3B82F6',
  },
  humidity: {
    title    : 'Détails : Variation Humidité',
    subtitle : "Analyse détaillée des relevés d'humidité sur la période sélectionnée",
    unit     : '%',
    AvgIcon  : Droplets, avgIconBg: 'bg-blue-50', avgIconColor: '#3B82F6',
    MaxIcon  : Droplets, maxIconBg: 'bg-red-50',  maxIconColor: '#EF4444',
    MinIcon  : Droplets, minIconBg: 'bg-blue-50', minIconColor: '#60A5FA',
  },
  sound: {
    title    : 'Détails : Variation Sonore',
    subtitle : 'Analyse détaillée des relevés acoustiques sur la période sélectionnée',
    unit     : 'Hz',
    AvgIcon  : Volume2, avgIconBg: 'bg-orange-50', avgIconColor: '#D97706',
    MaxIcon  : Volume2, maxIconBg: 'bg-red-50',    maxIconColor: '#EF4444',
    MinIcon  : Volume2, minIconBg: 'bg-blue-50',   minIconColor: '#3B82F6',
  },
  weight: {
    title    : 'Détails : Variation Poids',
    subtitle : 'Analyse détaillée de l\'évolution du poids sur la période sélectionnée',
    unit     : 'kg',
    AvgIcon  : Scale, avgIconBg: 'bg-gray-100', avgIconColor: '#6B7280',
    MaxIcon  : Scale, maxIconBg: 'bg-green-50', maxIconColor: '#22C55E',
    MinIcon  : Scale, minIconBg: 'bg-red-50',   minIconColor: '#EF4444',
  },
};

const StatCard = ({ label, value, unit, color, Icon, iconBg, iconColor, loading }) => (
  <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
    <div className="flex items-center justify-between mb-2.5">
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      {Icon && (
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
        </div>
      )}
    </div>
    {loading ? (
      <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
    ) : (
      <p className={`text-3xl font-bold tracking-tight ${color ?? 'text-gray-900'}`}>
        {value != null ? `${value}${unit}` : '—'}
      </p>
    )}
  </div>
);

const RangeTab = ({ id, label, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors
      ${active
        ? 'bg-amber-400 text-white shadow-sm'
        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
  >
    {label}
  </button>
);

const MetricDetailPage = () => {
  const { apiculteurId, hiveId, metric } = useParams();
  const navigate  = useNavigate();
  const id        = Number(hiveId);
  const base      = `/apiculteurs/${apiculteurId}`;
  const cfg       = METRIC_UI[metric] ?? METRIC_UI.sound;

  const {
    isLoading,
    unit,
    range, setRange,
    startDate, setStartDate,
    endDate,   setEndDate,
    avg, max, min, alerts,
    chartData, xAxisTicks,
    exportExcel,
  } = useMetricDetail(id, metric);

  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: '#FBFAF7' }}>
      <div className="relative z-10 flex flex-col gap-6 p-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`${base}/gestion/${hiveId}`)}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                         border border-gray-200 bg-white hover:bg-gray-50
                         text-gray-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{cfg.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{cfg.subtitle}</p>
            </div>
          </div>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-3 py-2 rounded-lg
                       bg-green-600 hover:bg-green-700 text-white text-xs font-bold
                       transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Excel
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="flex gap-4">
          <StatCard label="Moyenne" value={avg} unit={unit} color="text-gray-900"
            Icon={cfg.AvgIcon} iconBg={cfg.avgIconBg} iconColor={cfg.avgIconColor} loading={isLoading} />
          <StatCard label="Maximum" value={max} unit={unit} color="text-red-500"
            Icon={cfg.MaxIcon} iconBg={cfg.maxIconBg} iconColor={cfg.maxIconColor} loading={isLoading} />
          <StatCard label="Minimum" value={min} unit={unit} color="text-blue-500"
            Icon={cfg.MinIcon} iconBg={cfg.minIconBg} iconColor={cfg.minIconColor} loading={isLoading} />
          <StatCard label="Alertes" value={alerts} unit="" color="text-gray-900"
            Icon={Bell} iconBg="bg-gray-100" iconColor="#9CA3AF" loading={isLoading} />
        </div>

        {/* ── Detail chart ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Évolution Détaillée</h2>

            <div className="flex items-center gap-3">
              {/* Range tabs */}
              <div className="flex items-center gap-0.5 bg-gray-100 border border-gray-200 rounded-lg p-0.5">
                {[{ id: 'J', label: 'J' }, { id: '7j', label: '7j' }, { id: 'Mois', label: 'Mois' }].map(t => (
                  <RangeTab key={t.id} id={t.id} label={t.label} active={range === t.id} onClick={setRange} />
                ))}
              </div>

              {/* Custom date range */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  placeholder="Date début"
                  className="h-7 px-2 border border-gray-200 rounded-lg text-xs
                             text-gray-500 focus:outline-none focus:border-amber-400 bg-white"
                />
                <span className="text-gray-300">→</span>
                <input
                  type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  placeholder="Date fin"
                  className="h-7 px-2 border border-gray-200 rounded-lg text-xs
                             text-gray-500 focus:outline-none focus:border-amber-400 bg-white"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate('') }}
                    className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <MetricDetailChart
            data={chartData}
            metric={metric}
            unit={unit}
            isLoading={isLoading}
            xAxisTicks={xAxisTicks}
          />
        </div>

      </div>
    </div>
  );
};

export default MetricDetailPage;