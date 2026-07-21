"use client";

import AddLecturePage from "./addlecture";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  FiArrowLeft, FiBookOpen, FiEdit2, FiVideo, 
  FiTarget, FiCalendar, FiPlus, FiTrash2, 
  FiSave, FiX, FiClock, FiInfo 
} from 'react-icons/fi';
import NavbarPage from "../../components/Navbar";

const baseUrl = "https://code-minds-website.vercel.app/api";
// const baseUrl = "http://localhost:4000/api";

interface Lecture {
  _id: string;
  title: string;
  date: string;
  description?: string;
  videos?: string[];
  objectives?: string[];
}

interface GroupResponse {
  success: boolean;
  data: {
    _id: string;
    title: string;
    lectures?: Lecture[];
  };
  message?: string;
}

function ManageLecturesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = searchParams.get("groupId") || "";
  const groupTitle = searchParams.get("groupTitle") || "";

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [form, setForm] = useState({
    title: "",
    date: "",
    description: "",
    objectives: [""],
    videos: [""],
  });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setError(null);
      const token = window.localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/groups/${groupId}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });
      const json: GroupResponse = await res.json();
      if (!res.ok || !json?.success) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(json?.message || "Failed to fetch group lectures");
      }
      setLectures(json.data?.lectures || []);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openEdit = (lec: Lecture) => {
    setEditId(lec._id);
    setForm({
      title: lec.title || "",
      date: lec.date ? new Date(lec.date).toISOString().slice(0, 16) : "",
      description: lec.description || "",
      objectives: (lec.objectives?.length ? lec.objectives : [""]),
      videos: (lec.videos?.length ? lec.videos : [""]),
    });
  };

  const updateArrayItem = (key: "objectives" | "videos", index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev[key]];
      next[index] = value;
      return { ...prev, [key]: next };
    });
  };

  const addArrayItem = (key: "objectives" | "videos") => {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
  };

  const removeArrayItem = (key: "objectives" | "videos", index: number) => {
    setForm((prev) => {
      const next = [...prev[key]];
      next.splice(index, 1);
      return { ...prev, [key]: next.length ? next : [""] };
    });
  };

  const saveEdit = async (lectureId: string) => {
    try {
      setSaving(true);
      const token = window.localStorage.getItem("token");
      const payload = {
        ...form,
        objectives: form.objectives.filter(s => s.trim()),
        videos: form.videos.filter(s => s.trim()),
        date: form.date ? new Date(form.date).toISOString() : null,
      };
      const res = await fetch(`${baseUrl}/groups/editLecToGroup/${lectureId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      await refresh();
      setEditId(null);
    } catch (e: any) {
      alert(e?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f1f5f9' }}>
      <NavbarPage />
      
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '100px 20px 40px' }}>
        {/* Header Section */}
        <header style={{ marginBottom: '32px' }}>
          <button 
            onClick={() => router.back()} 
            style={{ background: 'none', border: 'none', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontWeight: 500 }}
          >
            <FiArrowLeft /> Back to Group
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#fff' }}>Manage Lectures</h1>
              <p style={{ color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiBookOpen size={14} /> {groupTitle || "Loading group..." }
              </p>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ 
                background: showAddForm ? '#1e293b' : '#3b82f6', 
                color: '#fff', 
                padding: '10px 20px', 
                borderRadius: '10px', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {showAddForm ? <><FiX /> Cancel</> : <><FiPlus /> Add New Lecture</>}
            </button>
          </div>
        </header>

        {error && (
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', color: '#fca5a5', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiInfo /> {error}
          </div>
        )}

        {/* Add Lecture Form Section */}
        {showAddForm && (
          <section style={{ 
            background: 'rgba(30, 41, 59, 0.5)', 
            border: '1px solid #334155', 
            borderRadius: '16px', 
            padding: '24px', 
            marginBottom: '32px',
            animation: 'fadeInDown 0.3s ease-out' 
          }}>
            <AddLecturePage groupId={groupId} onSuccess={() => { refresh(); setShowAddForm(false); }} />
          </section>
        )}

        {/* Lectures List */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiClock /> Timeline ({lectures.length})
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div className="spinner"></div>
              <p>Fetching lectures...</p>
            </div>
          ) : lectures.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#1e293b', borderRadius: '16px', border: '2px dashed #334155' }}>
              <p style={{ color: '#94a3b8' }}>No lectures scheduled for this group yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {lectures.map((lec) => (
                <div key={lec._id} style={{ 
                  background: '#1e293b', 
                  borderRadius: '16px', 
                  border: '1px solid #334155', 
                  overflow: 'hidden',
                  transition: 'border-color 0.2s'
                }}>
                  {editId === lec._id ? (
                    <div style={{ padding: '24px', display: 'grid', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                          <label>Lecture Title</label>
                          <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
                        </div>
                        <div className="input-group">
                          <label>Date & Time</label>
                          <input type="datetime-local" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} />
                        </div>
                      </div>
                      
                      <div className="input-group">
                        <label>Description</label>
                        <textarea rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Objectives</label>
                          {form.objectives.map((obj, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <input style={{ flex: 1 }} value={obj} onChange={e => updateArrayItem("objectives", idx, e.target.value)} />
                              <button className="icon-btn-delete" onClick={() => removeArrayItem("objectives", idx)}><FiTrash2 /></button>
                            </div>
                          ))}
                          <button className="add-btn-small" onClick={() => addArrayItem("objectives")}><FiPlus /> Add Objective</button>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Video Resources</label>
                          {form.videos.map((v, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <input style={{ flex: 1 }} value={v} onChange={e => updateArrayItem("videos", idx, e.target.value)} />
                              <button className="icon-btn-delete" onClick={() => removeArrayItem("videos", idx)}><FiTrash2 /></button>
                            </div>
                          ))}
                          <button className="add-btn-small" onClick={() => addArrayItem("videos")}><FiPlus /> Add Video</button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button onClick={() => setEditId(null)} className="btn-secondary">Cancel</button>
                        <button onClick={() => saveEdit(lec._id)} disabled={saving} className="btn-primary">
                          {saving ? 'Saving...' : <><FiSave /> Save Changes</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>{lec.title}</h3>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <FiCalendar size={12} /> {new Date(lec.date).toLocaleDateString(undefined, { dateStyle: 'full' })}
                          </span>
                        </div>
                        <button onClick={() => openEdit(lec)} className="edit-trigger">
                          <FiEdit2 /> Edit
                        </button>
                      </div>
                      
                      {lec.description && <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 16px' }}>{lec.description}</p>}
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', padding: '16px', background: '#0f172a', borderRadius: '12px' }}>
                        <div>
                          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6', marginBottom: '8px' }}>Objectives</h4>
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                            {lec.objectives?.map((o, i) => <li key={i} style={{ marginBottom: '4px' }}>{o}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6', marginBottom: '8px' }}>Resources</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {lec.videos?.map((v, i) => (
                              <a key={i} href={v} target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiVideo size={14} /> Video Resource {i + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <style jsx global>{`
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .input-group label { font-size: 0.85rem; font-weight: 600; color: #94a3b8; }
        .input-group input, .input-group textarea {
          padding: 10px 14px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          color: #f1f5f9;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .input-group input:focus { border-color: #3b82f6; outline: none; }
        
        .btn-primary { background: #3b82f6; color: white; border: none; padding: 10px 20px; borderRadius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .btn-secondary { background: transparent; color: #94a3b8; border: 1px solid #334155; padding: 10px 20px; borderRadius: 8px; font-weight: 600; cursor: pointer; }
        
        .icon-btn-delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px; border-radius: 6px; cursor: pointer; }
        .add-btn-small { background: transparent; color: #3b82f6; border: 1px dashed #3b82f6; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; margin-top: 4px; }
        
        .edit-trigger { background: #1e293b; color: #3b82f6; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .edit-trigger:hover { background: #3b82f6; color: white; border-color: #3b82f6; }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          header h1 { font-size: 1.5rem; }
          .input-group { grid-column: span 2 !important; }
          div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function ManageLecturesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '100px 20px', textAlign: 'center', color: '#3b82f6' }}>Loading Workspace...</div>}>
      <ManageLecturesContent />
    </Suspense>
  );
}
