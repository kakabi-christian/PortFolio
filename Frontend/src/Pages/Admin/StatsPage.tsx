import React, { useState, useEffect } from 'react';
import {
  MdBarChart,
  MdRefresh,
  MdMail,
  MdLayers,
  MdMiscellaneousServices,
  MdCode,
  MdStorage,
  MdBuild,
  MdPeople,
  MdMarkEmailUnread,
  MdReply,
  MdStar,
  MdImage,
  MdAttachMoney,
} from 'react-icons/md';
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import StatisticService from '../../Services/StatisticService';
import type { StatisticData, MonthlyCount } from '../../Models/Statistic';
import { getStorageUrl } from '../../Services/api';

/* ------------------------------------------------------------------ */
/* Styles communs                                                      */
/* ------------------------------------------------------------------ */

const thStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
  backgroundColor: '#f8fafc',
  color: '#64748b',
};

// Style commun des cartes : fond blanc + ombre douce
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#1e293b',
  border: '1px solid #f1f5f9',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)',
};

const innerBoxStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #f1f5f9',
};

/* ------------------------------------------------------------------ */
/* Petits composants réutilisables                                     */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  bg?: string;
  delay?: number;
}

function StatCard({ label, value, icon, color = '#2563eb', bg = '#eff6ff', delay = 0 }: StatCardProps) {
  return (
    <div className="col-6 col-md-4 col-xl-3" data-aos="fade-up" data-aos-delay={delay}>
      <div
        className="card h-100"
        style={{ ...cardStyle, borderRadius: '16px', transition: 'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(37, 99, 235, 0.14), 0 4px 10px rgba(15, 23, 42, 0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = cardStyle.boxShadow as string;
        }}
      >
        <div className="card-body p-3 d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: '52px', height: '52px', backgroundColor: bg, color }}
          >
            {icon}
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '1.6rem', lineHeight: 1.1, color: '#0f172a' }}>
              {value}
            </div>
            <div
              className="text-uppercase font-monospace"
              style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: '#64748b' }}
            >
              {label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="card h-100"
      style={{ ...cardStyle, borderRadius: '20px' }}
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      <div className="card-body p-4">
        <h6 className="fw-bold d-flex align-items-center mb-4" style={{ color: '#0f172a' }}>
          <span
            className="p-2 rounded-3 me-2 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
          >
            {icon}
          </span>
          {title}
        </h6>
        {children}
      </div>
    </div>
  );
}

/** Histogramme vertical en CSS pur (12 derniers mois). */
function MonthlyBarChart({ data }: { data: MonthlyCount[] }) {
  const max = Math.max(...data.map((d) => d.total), 0);

  const formatMonth = (m: string) => {
    const [year, month] = m.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'short' });
  };

  return (
    <div className="d-flex align-items-end justify-content-between gap-1" style={{ height: '200px' }}>
      {data.map((d) => {
        const height = max > 0 ? (d.total / max) * 140 : 0;
        return (
          <div
            key={d.month}
            className="d-flex flex-column align-items-center justify-content-end flex-fill"
            style={{ height: '100%' }}
          >
            <span className="fw-semibold mb-1" style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {d.total}
            </span>
            <div
              title={`${d.month} : ${d.total}`}
              style={{
                width: '100%',
                maxWidth: '28px',
                height: `${Math.max(height, 4)}px`,
                backgroundColor: d.total > 0 ? '#2563eb' : '#e2e8f0',
                borderRadius: '6px 6px 0 0',
                transition: 'height 0.6s ease',
              }}
            />
            <span className="mt-2 text-capitalize" style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {formatMonth(d.month)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Liste de barres horizontales (répartition par catégorie / type / rôle). */
function DistributionList({ items }: { items: { label: string; total: number }[] }) {
  const sum = items.reduce((acc, i) => acc + i.total, 0);

  if (items.length === 0) {
    return (
      <p className="mb-0" style={{ fontSize: '0.85rem', color: '#64748b' }}>
        Aucune donnée.
      </p>
    );
  }

  return (
    <>
      {items.map((item) => {
        const percentage = sum > 0 ? Math.round((item.total / sum) * 100) : 0;
        return (
          <div key={item.label} className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.85rem' }}>
              <span className="fw-semibold" style={{ color: '#0f172a' }}>{item.label}</span>
              <span className="fw-bold" style={{ color: '#64748b' }}>{item.total}</span>
            </div>
            <div
              className="progress shadow-none"
              style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}
            >
              <div
                className="progress-bar"
                role="progressbar"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: '#2563eb',
                  borderRadius: '4px',
                  transition: 'width 0.6s ease',
                }}
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Page principale                                                     */
/* ------------------------------------------------------------------ */

export default function StatsPage() {
  const [stats, setStats] = useState<StatisticData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await StatisticService.getAll();
      setStats(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques', err);
      setErrorMsg('Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatPrice = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    return isNaN(n) ? String(value) : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  };

  return (
    <div className="container-fluid py-5" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">

          {/* Header de la page */}
          <div
            className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3"
            data-aos="fade-down"
          >
            <div>
              <h2
                className="fw-extrabold mb-1 d-flex align-items-center"
                style={{ letterSpacing: '-0.5px', color: '#0f172a' }}
              >
                <div
                  className="p-2 rounded-3 me-3 shadow-sm d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
                >
                  <MdBarChart size={28} />
                </div>
                Tableau de Bord
              </h2>
              <p className="mb-0" style={{ fontSize: '0.95rem', color: '#64748b' }}>
                Suivez en un coup d'œil l'activité et les statistiques de votre plateforme.
              </p>
            </div>
            <button
              className="btn fw-bold d-flex align-items-center justify-content-center shadow-lg px-4 py-2 text-white transition-all"
              onClick={fetchStats}
              disabled={loading}
              style={{ backgroundColor: '#2563eb', borderRadius: '12px', border: 'none', transition: 'transform 0.2s' }}
            >
              <MdRefresh size={22} className="me-2" /> Actualiser
            </button>
          </div>

          {/* Message d'erreur */}
          {errorMsg && (
            <div
              className="alert border-0 shadow-sm mb-4 text-white"
              style={{ backgroundColor: '#ef4444', borderRadius: '12px' }}
              data-aos="fade-in"
            >
              <strong>{errorMsg}</strong>
            </div>
          )}

          {/* Chargement initial */}
          {loading && !stats && (
            <div className="text-center py-5" style={{ color: '#64748b' }}>
              <div
                className="spinner-border text-primary me-2"
                role="status"
                style={{ width: '1.5rem', height: '1.5rem' }}
              ></div>
              Chargement en cours...
            </div>
          )}

          {stats && (
            <>
              {/* Cartes : vue d'ensemble */}
              <div className="row g-3 mb-4">
                <StatCard label="Messages" value={stats.overview.total_contacts} icon={<MdMail size={26} />} delay={0} />
                <StatCard label="Projets" value={stats.overview.total_projects} icon={<MdLayers size={26} />} delay={50} />
                <StatCard label="Services" value={stats.overview.total_services} icon={<MdMiscellaneousServices size={26} />} delay={100} />
                <StatCard label="Frameworks" value={stats.overview.total_frameworks} icon={<MdCode size={26} />} delay={150} />
                <StatCard label="Bases de données" value={stats.overview.total_databases} icon={<MdStorage size={26} />} delay={200} />
                <StatCard label="Outils" value={stats.overview.total_tools} icon={<MdBuild size={26} />} delay={250} />
                <StatCard label="Utilisateurs" value={stats.overview.total_users} icon={<MdPeople size={26} />} delay={300} />
                <StatCard
                  label="Non lus"
                  value={stats.contacts.unread}
                  icon={<MdMarkEmailUnread size={26} />}
                  color="#dc2626"
                  bg="#fef2f2"
                  delay={350}
                />
              </div>

              {/* Messages */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-lg-7">
                  <SectionCard title="Messages reçus (12 derniers mois)" icon={<MdMail size={18} />} delay={100}>
                    <MonthlyBarChart data={stats.charts.contacts_per_month} />
                  </SectionCard>
                </div>
                <div className="col-12 col-lg-5">
                  <SectionCard title="Détail des messages" icon={<MdReply size={18} />} delay={150}>
                    <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.85rem' }}>
                      <span className="fw-semibold" style={{ color: '#0f172a' }}>Taux de réponse</span>
                      <span className="fw-bold" style={{ color: '#2563eb' }}>{stats.contacts.reply_rate}%</span>
                    </div>
                    <div
                      className="progress shadow-none mb-4"
                      style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}
                    >
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: `${stats.contacts.reply_rate}%`,
                          backgroundColor: '#2563eb',
                          borderRadius: '4px',
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>

                    <div className="row g-2">
                      {[
                        { label: 'Lus', value: stats.contacts.read },
                        { label: 'Non lus', value: stats.contacts.unread },
                        { label: 'Répondus', value: stats.contacts.replied },
                        { label: 'Sans réponse', value: stats.contacts.not_replied },
                        { label: "Aujourd'hui", value: stats.contacts.today },
                        { label: 'Cette semaine', value: stats.contacts.this_week },
                        { label: 'Ce mois', value: stats.contacts.this_month },
                      ].map((item) => (
                        <div key={item.label} className="col-6">
                          <div
                            className="p-2 px-3 rounded-3 d-flex justify-content-between align-items-center"
                            style={innerBoxStyle}
                          >
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.label}</span>
                            <span className="fw-bold" style={{ color: '#0f172a' }}>{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </div>

              {/* Projets */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-lg-7">
                  <SectionCard title="Projets créés (12 derniers mois)" icon={<MdLayers size={18} />} delay={100}>
                    <MonthlyBarChart data={stats.charts.projects_per_month} />
                  </SectionCard>
                </div>
                <div className="col-12 col-lg-5">
                  <SectionCard title="Détail des projets" icon={<MdStar size={18} />} delay={150}>
                    <div className="row g-2">
                      {[
                        { label: 'Total', value: stats.projects.total },
                        { label: 'Mis en avant', value: stats.projects.featured },
                        { label: 'Avec GitHub', value: stats.projects.with_github },
                        { label: 'Avec démo', value: stats.projects.with_demo },
                      ].map((item) => (
                        <div key={item.label} className="col-6">
                          <div className="p-3 rounded-3 text-center" style={innerBoxStyle}>
                            <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#0f172a' }}>{item.value}</div>
                            <div className="text-uppercase font-monospace" style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {item.label}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </div>

              {/* Compétences */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6 col-xl-4">
                  <SectionCard title="Frameworks par catégorie" icon={<MdCode size={18} />} delay={100}>
                    <DistributionList
                      items={stats.skills.frameworks.by_category.map((c) => ({ label: c.category, total: c.total }))}
                    />
                    <div
                      className="mt-2 pt-3 d-flex justify-content-between align-items-center"
                      style={{ borderTop: '1px solid #f1f5f9', fontSize: '0.85rem' }}
                    >
                      <span style={{ color: '#64748b' }}>Maîtrise moyenne</span>
                      <span
                        className="badge px-3 py-2 fw-semibold"
                        style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '8px' }}
                      >
                        {stats.skills.frameworks.avg_proficiency}%
                      </span>
                    </div>
                  </SectionCard>
                </div>
                <div className="col-12 col-md-6 col-xl-4">
                  <SectionCard title="Bases de données par type" icon={<MdStorage size={18} />} delay={150}>
                    <DistributionList
                      items={stats.skills.databases.by_type.map((t) => ({ label: t.type, total: t.total }))}
                    />
                  </SectionCard>
                </div>
                <div className="col-12 col-md-6 col-xl-4">
                  <SectionCard title="Outils par catégorie" icon={<MdBuild size={18} />} delay={200}>
                    <DistributionList
                      items={stats.skills.tools.by_category.map((c) => ({ label: c.category, total: c.total }))}
                    />
                  </SectionCard>
                </div>
              </div>

              {/* Services + Utilisateurs */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-lg-6">
                  <SectionCard title="Services" icon={<MdAttachMoney size={18} />} delay={100}>
                    <div className="row g-2">
                      {[
                        { label: 'Total', value: stats.services.total },
                        { label: 'Prix min.', value: formatPrice(stats.services.min_price) },
                        { label: 'Prix max.', value: formatPrice(stats.services.max_price) },
                        { label: 'Prix moyen', value: formatPrice(stats.services.avg_price) },
                      ].map((item) => (
                        <div key={item.label} className="col-6 col-md-3">
                          <div className="p-3 rounded-3 text-center" style={innerBoxStyle}>
                            <div className="fw-bold" style={{ fontSize: '1.2rem', color: '#0f172a' }}>{item.value}</div>
                            <div className="text-uppercase font-monospace" style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {item.label}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
                <div className="col-12 col-lg-6">
                  <SectionCard title="Utilisateurs par rôle" icon={<MdPeople size={18} />} delay={150}>
                    <DistributionList
                      items={stats.users.by_role.map((r) => ({ label: r.role, total: r.total }))}
                    />
                  </SectionCard>
                </div>
              </div>

              {/* Derniers messages */}
              <div
                className="card overflow-hidden mb-4"
                style={{ ...cardStyle, borderRadius: '20px' }}
                data-aos="fade-up"
              >
                <div className="card-header border-0 pt-4 px-4 pb-0" style={{ backgroundColor: '#ffffff' }}>
                  <h6 className="fw-bold mb-0" style={{ color: '#0f172a' }}>Derniers messages</h6>
                </div>
                <div className="card-body p-0 mt-3">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0" style={{ color: '#1e293b', backgroundColor: '#ffffff' }}>
                      <thead style={{ borderBottom: '2px solid #f1f5f9' }}>
                        <tr>
                          <th className="py-3 px-4 text-uppercase font-monospace" style={thStyle}>Expéditeur</th>
                          <th className="py-3 px-4 text-uppercase font-monospace" style={thStyle}>Sujet</th>
                          <th className="py-3 px-4 text-uppercase font-monospace" style={thStyle}>Statut</th>
                          <th className="py-3 px-4 text-uppercase font-monospace" style={thStyle}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.latest.contacts.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-5" style={{ color: '#64748b' }}>
                              Aucun message.
                            </td>
                          </tr>
                        ) : (
                          stats.latest.contacts.map((c) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td className="py-3 px-4" style={{ backgroundColor: '#ffffff' }}>
                                <div className="fw-bold" style={{ color: '#0f172a' }}>{c.sender_name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.sender_email}</div>
                              </td>
                              <td
                                className="py-3 px-4"
                                style={{
                                  maxWidth: '280px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  color: '#64748b',
                                  backgroundColor: '#ffffff',
                                }}
                              >
                                {c.subject}
                              </td>
                              <td className="py-3 px-4" style={{ backgroundColor: '#ffffff' }}>
                                {c.is_read ? (
                                  <span
                                    className="badge px-3 py-2 fw-semibold"
                                    style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                  >
                                    Lu
                                  </span>
                                ) : (
                                  <span
                                    className="badge px-3 py-2 fw-semibold"
                                    style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '8px' }}
                                  >
                                    Non lu
                                  </span>
                                )}
                              </td>
                              <td
                                className="py-3 px-4"
                                style={{ fontSize: '0.85rem', color: '#64748b', backgroundColor: '#ffffff' }}
                              >
                                {formatDate(c.created_at)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Derniers projets */}
              <div
                className="card overflow-hidden"
                style={{ ...cardStyle, borderRadius: '20px' }}
                data-aos="fade-up"
              >
                <div className="card-header border-0 pt-4 px-4 pb-0" style={{ backgroundColor: '#ffffff' }}>
                  <h6 className="fw-bold mb-0" style={{ color: '#0f172a' }}>Derniers projets</h6>
                </div>
                <div className="card-body p-0 mt-3">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0" style={{ color: '#1e293b', backgroundColor: '#ffffff' }}>
                      <thead style={{ borderBottom: '2px solid #f1f5f9' }}>
                        <tr>
                          <th className="py-3 px-4 text-uppercase font-monospace" style={thStyle}>Image</th>
                          <th className="py-3 px-4 text-uppercase font-monospace" style={thStyle}>Titre</th>
                          <th className="py-3 px-4 text-uppercase font-monospace" style={thStyle}>Statut</th>
                          <th className="py-3 px-4 text-uppercase font-monospace" style={thStyle}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.latest.projects.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-5" style={{ color: '#64748b' }}>
                              Aucun projet.
                            </td>
                          </tr>
                        ) : (
                          stats.latest.projects.map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td className="py-3 px-4" style={{ backgroundColor: '#ffffff' }}>
                                {p.image_url ? (
                                  <img
                                    src={getStorageUrl(p.image_url)}
                                    alt={p.title}
                                    style={{
                                      width: '48px',
                                      height: '48px',
                                      objectFit: 'cover',
                                      borderRadius: '10px',
                                      backgroundColor: '#f8fafc',
                                      border: '1px solid #e2e8f0',
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '48px',
                                      height: '48px',
                                      borderRadius: '10px',
                                      backgroundColor: '#f8fafc',
                                      border: '1px solid #e2e8f0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <MdImage size={20} style={{ color: '#94a3b8' }} />
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 fw-bold" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
                                {p.title}
                              </td>
                              <td className="py-3 px-4" style={{ backgroundColor: '#ffffff' }}>
                                {p.featured ? (
                                  <span
                                    className="badge px-3 py-2 fw-semibold"
                                    style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '8px' }}
                                  >
                                    Mis en avant
                                  </span>
                                ) : (
                                  <span
                                    className="badge px-3 py-2 fw-semibold"
                                    style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                  >
                                    Standard
                                  </span>
                                )}
                              </td>
                              <td
                                className="py-3 px-4"
                                style={{ fontSize: '0.85rem', color: '#64748b', backgroundColor: '#ffffff' }}
                              >
                                {formatDate(p.created_at)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}