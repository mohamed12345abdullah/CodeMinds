'use client';

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { FiCopy, FiCheck, FiExternalLink, FiUsers, FiBookOpen } from 'react-icons/fi';
import NavbarPage from "../../components/Navbar";

const BASE_URL = "https://code-minds-website.vercel.app/api";
// const BASE_URL = "http://localhost:4000/api";
const JOIN_BASE_URL = "https://code-minds.vercel.app/join";

interface Group {
    _id: string;
    title?: string;
    course: string | { _id: string; title?: string };
}

type GroupStatus = 'inProgress' | 'pending' | 'ended';

// Sub-component for better performance and isolation of "Copied" state
const GroupCard = memo(({ group }: { group: Group }) => {
    const [isCopied, setIsCopied] = useState(false);
    const router = useRouter();
    const joinUrl = `${JOIN_BASE_URL}?code=${group._id}`;

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(joinUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const courseTitle = typeof group.course === 'string' 
        ? group.course 
        : (group.course?.title || 'Unknown Course');

    const groupTitle = group.title || 'Untitled Group';

    return (
        <div 
            onClick={() => router.push(`/instructorDashboard/groupDetails?id=${group._id}`)}
            style={{
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                animation: 'fadeInUp 0.5s ease forwards',
                cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 600 }}>{groupTitle}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>ID: {group._id}</p>
                </div>
                <div 
                    style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  groupDetails <FiExternalLink size={14} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                    <FiBookOpen size={16} color="#64748b" />
                    <span>{courseTitle}</span>
                </div>
            </div>

            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: '#0f172a', 
                padding: '8px 12px', 
                borderRadius: '8px',
                border: '1px solid #334155'
            }}>
                <code style={{ flex: 1, fontSize: '0.8rem', color: '#3b82f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {joinUrl}
                </code>
                <button 
                    onClick={handleCopy}
                    aria-label="Copy join link"
                    style={{
                        background: isCopied ? '#10b981' : '#334155',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background 0.2s'
                    }}
                >
                    {isCopied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </button>
            </div>
        </div>
    );
});

export default function ProgressPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [status, setStatus] = useState<GroupStatus>('inProgress');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGroups = useCallback(async (nextStatus: GroupStatus) => {
        try {
            setLoading(true);
            setError(null);
            setStatus(nextStatus);
            
            const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
            
            const response = await fetch(`${BASE_URL}/groups/status/${nextStatus}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();
            
            if (response.ok) {
                setGroups(Array.isArray(result?.data) ? result.data : []);
            } else {
                if (response.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                throw new Error(result?.message || 'Failed to fetch groups');
            }
        } catch (e: any) {
            setError(e?.message || 'Something went wrong');
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGroups('inProgress');
    }, [fetchGroups]);

    const tabs: { id: GroupStatus; label: string }[] = [
        { id: 'inProgress', label: 'In Progress' },
        { id: 'pending', label: 'Pending' },
        { id: 'ended', label: 'Ended' }
    ];

    return (
        <div style={{ background: '#0f172a', minHeight: '100vh' }}>
        <NavbarPage />
        <div style={{ 
            maxWidth: '1200px', 
            margin: '60px auto 0', 
            padding: '40px 24px',
            color: '#f1f5f9'
        }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>
                    Groups Progress
                </h1>
                <p style={{ color: '#94a3b8' }}>Manage and monitor your active learning groups</p>
            </header>

            <nav style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '32px',
                padding: '4px',
                background: '#1e293b',
                borderRadius: '10px',
                overflowX: 'auto',
                width: 'fit-content'
            }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => fetchGroups(tab.id)}
                        aria-selected={status === tab.id}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                            background: status === tab.id ? '#3b82f6' : 'transparent',
                            color: status === tab.id ? '#fff' : '#cbd5e1',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {error && (
                <div style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    background: '#451a03', 
                    border: '1px solid #92400e', 
                    color: '#fed7aa',
                    marginBottom: '24px' 
                }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <FiUsers />
                <span>Total Groups: {groups.length}</span>
            </div>

            {loading ? (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                    gap: '20px' 
                }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: '180px', background: '#1e293b', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
                    ))}
                </div>
            ) : (
                <>
                    {groups.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '60px 20px', 
                            background: '#1e293b', 
                            borderRadius: '16px',
                            border: '2px dashed #334155'
                        }}>
                            <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>No groups found in this category.</p>
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                            gap: '20px' 
                        }}>
                            {groups.map((g) => (
                                <GroupCard key={g._id} group={g} />
                            ))}
                        </div>
                    )}
                </>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .details-link:hover {
                    text-decoration: underline !important;
                    opacity: 0.8;
                }
            `}</style>
        </div>
        </div>
    );
}
