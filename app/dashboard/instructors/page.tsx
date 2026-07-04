'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import './instructors.css';

interface Instructor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profileRef: {
    _id: string;
    specialization: string;
    experienceYears: string;
    bio: string;
    github: string;
    linkedin: string;
    coursesCanTeach: string;
    status: string;
    cv: {
      fileId: string;
      fileUrl: string;
    };
  };
}

export default function InstructorsRequests() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCV, setSelectedCV] = useState<string | null>(null);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
 

      const response = await fetch(`https://code-minds-website.vercel.app/api/instructor`);
      const data = await response.json();
      if (data.success) {
        setInstructors(data.data);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (instructorId: string, profileRefId: string) => {
    try {
      const response = await fetch(`https://code-minds-website.vercel.app/api/instructors/${profileRefId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'accepted' })
      });

      if (response.ok) {
        setInstructors(prev =>
          prev.map(inst =>
            inst._id === instructorId
              ? { ...inst, profileRef: { ...inst.profileRef, status: 'accepted' } }
              : inst
          )
        );
        alert('تم قبول المحاضر بنجاح!');
      } else {
        alert('فشل في قبول المحاضر');
      }
    } catch (error) {
      console.error('Error accepting instructor:', error);
      alert('حدث خطأ أثناء قبول المحاضر');
    }
  };

  const handleReject = async (instructorId: string, profileRefId: string) => {
    try {
      const response = await fetch(`https://code-minds-website.vercel.app/api/instructor/${profileRefId}/status`, {
        method: 'PATCH',
        headers: {  
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) {
        setInstructors(prev =>
          prev.map(inst =>
            inst._id === instructorId
              ? { ...inst, profileRef: { ...inst.profileRef, status: 'rejected' } }
              : inst
          )
        );
        alert('تم رفض المحاضر');
      } else {
        alert('فشل في رفض المحاضر');
      }
    } catch (error) {
      console.error('Error rejecting instructor:', error);
      alert('حدث خطأ أثناء رفض المحاضر');
    }
  };

  if (loading) {
    return (
      <div className="instructors-container">
        <Navbar />
        <div className="loading">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="instructors-container">
      <Navbar />
      <div className="instructors-content">
        <h1 className="page-title">طلبات المحاضرين</h1>
        
        <div className="instructors-grid">
          {instructors.map((instructor) => (
            <div key={instructor._id} className="instructor-card">
              <div className="instructor-header">
                <h3 className="instructor-name">{instructor.name}</h3>
                <span className={`status-badge ${instructor.profileRef.status}`}>
                  {instructor.profileRef.status === 'pending' ? 'في الانتظار' : 
                   instructor.profileRef.status === 'accepted' ? 'مقبول' : 'مرفوض'}
                </span>
              </div>

              <div className="instructor-info">
                <div className="info-item">
                  <strong>البريد الإلكتروني:</strong>
                  <span>{instructor.email}</span>
                </div>
                <div className="info-item">
                  <strong>رقم الهاتف:</strong>
                  <span>{instructor.phone}</span>
                </div>
                <div className="info-item">
                  <strong>التخصص:</strong>
                  <span>{instructor.profileRef.specialization}</span>
                </div>
                <div className="info-item">
                  <strong>سنوات الخبرة:</strong>
                  <span>{instructor.profileRef.experienceYears}</span>
                </div>
                <div className="info-item">
                  <strong>الدورات التي يمكن تدريسها:</strong>
                  <span>{instructor.profileRef.coursesCanTeach}</span>
                </div>
                <div className="info-item">
                  <strong>نبذة:</strong>
                  <span>{instructor.profileRef.bio}</span>
                </div>
                {instructor.profileRef.github && (
                  <div className="info-item">
                    <strong>GitHub:</strong>
                    <a href={instructor.profileRef.github} target="_blank" rel="noopener noreferrer">
                      {instructor.profileRef.github}
                    </a>
                  </div>
                )}
                {instructor.profileRef.linkedin && (
                  <div className="info-item">
                    <strong>LinkedIn:</strong>
                    <a href={instructor.profileRef.linkedin} target="_blank" rel="noopener noreferrer">
                      {instructor.profileRef.linkedin}
                    </a>
                  </div>
                )}
              </div>

              <div className="cv-section">
                <button 
                  className="view-cv-btn"
                  onClick={() => setSelectedCV(instructor.profileRef.cv.fileUrl)}
                >
                  عرض السيرة الذاتية
                </button>
              </div>

              {instructor.profileRef.status === 'pending' && (
                <div className="instructor-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleAccept(instructor._id, instructor.profileRef._id)}
                  >
                    قبول
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(instructor._id, instructor.profileRef._id)}
                  >
                    رفض
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedCV && (
          <div className="cv-modal-overlay" onClick={() => setSelectedCV(null)}>
            <div className="cv-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-cv-btn" onClick={() => setSelectedCV(null)}>×</button>
              <iframe
                src={selectedCV}
                title="CV Preview"
                className="cv-iframe"
                width="100%"
                height="600"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}








