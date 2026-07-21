"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiBook, FiLayers, FiActivity, FiArrowRight, FiMonitor } from 'react-icons/fi';
import NavbarPage from "../components/Navbar";
import { group } from "console";

const baseUrl = "https://code-minds-website.vercel.app/api";
// const baseUrl = "http://localhost:4000/api";


interface Group {
  _id: string;
  title: string;
  course: {
    _id: string;
    title: string;
  };
}

export default function InstructorDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const response = await fetch(`${baseUrl}/groups/instructorGroups/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (Array.isArray(data.data)) {
          setGroups(data.data);
        } else {
          setGroups([]);
        }
      } else {
        if (response.status === 401) {
          alert("⚠️ You are not authorized to view this page");
          window.location.href = "/login";
        } else {
          setError("❌ Failed to fetch groups");
        }
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError("❌ Something went wrong while fetching groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user?._id) {
        fetchGroups(user._id);
      } else {
        setError("⚠️ No user found in localStorage");
        setLoading(false);
      }
    }
  }, [fetchGroups]);

  const stats = useMemo(() => {
    const totalGroups = groups.length; // Corrected to use groups.length
    const uniqueCourses = new Set(groups.map((g) => g.course?._id)).size; // Corrected to use groups.map
    return { totalGroups, uniqueCourses };
  }, [groups]);

  return (
    <div className="dashboard-container main-content">
      <NavbarPage />
      
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="dashboard-title">
            <FiMonitor className="dashboard-icon" /> Instructor Workspace
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '8px' }}>
            Manage your active learning groups and track student performance.
          </p>
        </header>

        {error && (
          <div style={{ 
            padding: '16px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444', 
            borderRadius: '12px', 
            color: '#fca5a5', 
            marginBottom: '32px' 
          }}>
            {error}
          </div>
        )}

        {/* Stats Overview */}
        {!loading && !error && (
          <section style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '20px', 
            marginBottom: '48px' 
          }}>
            <div className="stat-card">
              <FiLayers size={24} color="#3b82f6" />
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Groups</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{stats.totalGroups}</div>
              </div>
            </div>
            <div className="stat-card">
              <FiBook size={24} color="#10b981" />
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Courses</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{stats.uniqueCourses}</div>
              </div>
            </div>
            <div className="stat-card">
              <FiActivity size={24} color="#f59e0b" />
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{stats.totalGroups > 0 ? "Active" : "Idle"}</div>
              </div>
            </div>


                  <Link href={`../dashboard/add-student`}>

                    <div className="stat-card">
                            <FiActivity size={24} color="#f59e0b" />
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>dashboard</div>
                              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}> add student</div>
                            </div>
                    </div>
             
                </Link>
          </section>
        )}

        {/* Groups Grid */}
        
  

        <section className="groups-section">
          <h2 className="groups-title">Your Groups</h2>
          {loading ? (
            <div className="groups-grid">
              {[1, 2, 3].map(i => <div key={i} className="loading-card" />)}
            </div>
          ) : groups.length === 0 ? (
            <div className="no-groups-message">
              <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>No groups assigned to your account yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {groups.map((group, index) => (
                <Link
                  key={group._id}
                  href={`/instructorDashboard/groupDetails?id=${group._id}`}
                  aria-label={`View details for ${group.title}`}
                  className="group-card" // Apply class for styling
                  style={{ animationDelay: `${index * 0.15}s` }} // Staggered animation delay
                >
                  <div className="group-card-content">
                    <h3 className="group-card-title">{group.title}</h3>
                    <p className="group-card-course">
                      {group.course?.title || "General Course"}
                    </p>
                  </div>
                  <div className="group-card-footer">
                    <span className="group-card-id">ID: {group._id.slice(-8)}</span>
                    <span className="group-card-details-link">
                      Details <FiArrowRight />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <style jsx global>{`
        :root {
          --bg-primary: #0f172a;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --color-blue: #3b82f6;
          --color-green: #10b981;
          --color-orange: #f59e0b;
          --border-color-light: rgba(255, 255, 255, 0.1);
          --card-bg-alpha: rgba(30, 41, 59, 0.7);
          --card-bg-hover-alpha: rgba(30, 41, 59, 0.9);
          --section-bg-alpha: rgba(30, 41, 59, 0.3);
          --error-bg: rgba(239, 68, 68, 0.1);
          --error-border: #ef4444;
          --error-text: #fca5a5;
          --loading-bg: #1e293b;
          --navbar-height: 80px; /* Assuming a fixed navbar height. Adjust this value if your NavbarPage component has a different height. */
        }

        .dashboard-container {
          background: var(--bg-primary);
          min-height: 100vh;
          color: var(--text-primary);
        }
        
        .dashboard-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: calc(var(--navbar-height) + 40px) 24px 40px; /* Account for fixed navbar */
        }

        .dashboard-header {
          margin-bottom: 40px;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dashboard-icon {
          color: var(--color-blue);
        }

        .dashboard-subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
          margin-top: 8px;
        }

        .error-message {
          padding: 16px;
          background: var(--error-bg);
          border: 1px solid var(--error-border);
          border-radius: 12px;
          color: var(--error-text);
          margin-bottom: 32px;
        }

        .stat-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          padding: 24px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .stat-label {
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }

        .groups-section {
          background: var(--section-bg-alpha);
          border: 1px solid #96bef6ff;
          padding: 32px;
          border-radius: 24px;
          backdrop-filter: blur(8px);
        }

        .groups-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 24px;
          color: var(--text-primary);
        }

        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .loading-card {
          height: 160px;
          background: var(--loading-bg);
          border-radius: 16px;
          animation: pulse 1.5s infinite;
        }

        .no-groups-message {
          text-align: center;
          padding: 80px 20px;
          background: var(--loading-bg);
          border-radius: 20px;
          border: 2px dashed #334155;
        }

        .no-groups-message p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .group-card {
          background: var(--card-bg-alpha);
          backdrop-filter: blur(10px);
          padding: 24px;
          border-radius: 16px;
          border: 1px solid var(--border-color-light);
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%; /* Ensure cards take full height in grid */
          position: relative;
          overflow: hidden;
          animation: fadeInUp 0.5s ease forwards; /* Changed to forwards */
        }
        .group-card:hover {
          transform: translateY(-5px);
          border-color: #3b82f6;
          background: rgba(30, 41, 59, 0.9);
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.2);
        }

        .group-card-content {
          margin-bottom: 16px;
        }

        .group-card-title {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-primary);
          font-weight: 700;
        }

        .group-card-course {
          margin: 4px 0 0;
          font-size: 0.9rem;
          color: var(--color-blue);
          font-weight: 500;
        }

        .group-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .group-card-id {
          font-size: 0.8rem;
          color: #64748b;
          font-family: monospace;
        }

        .group-card-details-link {
          color: var(--color-blue);
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0.6;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .dashboard-main {
            padding-top: calc(var(--navbar-height) + 20px);
          }
          .dashboard-title { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
}