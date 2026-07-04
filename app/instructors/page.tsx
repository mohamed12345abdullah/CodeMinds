"use client";
import React, { useState, useEffect, useCallback } from "react";
import "./instructor.css";
import Navbar from "../components/Navbar";
import { verifyTokenApi } from "../apis/auth";
import { FiBriefcase, FiGithub, FiLinkedin, FiFileText, FiBookOpen, FiUser, FiSend, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const baseUrl = "https://code-minds-website.vercel.app/api";

interface FormState {
  specialization: string;
  experienceYears: string;
  bio: string;
  github: string;
  linkedin: string;
  coursesCanTeach: string;
  cvLink: string;
}

export default function InstructorRequestForm() {
  const [formData, setFormData] = useState<FormState>({
    specialization: "",
    experienceYears: "",
    bio: "",
    github: "",
    linkedin: "",
    coursesCanTeach: "",
    cvLink: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const result = await verifyTokenApi();
        setIsAuthorized(result);
      } catch (err) {
        setIsAuthorized(false);
      }
    }
    checkAuth();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!formData.specialization) newErrors.specialization = "Specialization is required";
    if (!formData.cvLink) newErrors.cvLink = "A link to your CV is required";
    if (formData.github && !formData.github.startsWith('http')) newErrors.github = "Please enter a valid URL";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/instructors/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const response = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setFormData({
          specialization: "",
          experienceYears: "",
          bio: "",
          github: "",
          linkedin: "",
          coursesCanTeach: "",
          cvLink: "",
        });
      } else {
        throw new Error(response?.message || "Submission failed");
      }
    } catch (error: any) {
      alert(error.message || "Failed to connect to the server ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="loading-viewport">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  return (
    <div className="instructor-page-wrapper">
      <Navbar />
      <main className="form-main-content">
        <header className="form-header">
          <h1 className="hero-title">Become an Instructor</h1>
          <p className="hero-subtitle">Join our community of experts and help shape the next generation of developers.</p>
        </header>

        <div className={`form-container-glass ${isSuccess ? 'success-mode' : ''}`}>
          {isSuccess ? (
            <div className="success-animation">
              <div className="check-icon-wrapper">
                <FiCheckCircle size={80} color="#10b981" />
              </div>
              <h2>Application Received!</h2>
              <p>Thank you for applying. Our team will review your profile and get back to you via email within 3-5 business days.</p>
              <button onClick={() => setIsSuccess(false)} className="submit-button secondary">
                Submit Another Application
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="modern-form">
              <div className="form-grid">
                <FormField 
                  label="Specialization" 
                  name="specialization" 
                  icon={<FiBriefcase />}
                  value={formData.specialization} 
                  onChange={handleChange} 
                  error={errors.specialization}
                  placeholder="e.g. Full Stack Web Development"
                />
                <FormField 
                  label="Years of Experience" 
                  name="experienceYears" 
                  type="number"
                  icon={<FiUser />}
                  value={formData.experienceYears} 
                  onChange={handleChange} 
                  error={errors.experienceYears}
                  placeholder="e.g. 5"
                />
                <div className="full-width">
                  <FormField 
                    label="Professional Bio" 
                    name="bio" 
                    isTextArea
                    icon={<FiFileText />}
                    value={formData.bio} 
                    onChange={handleChange} 
                    error={errors.bio}
                    placeholder="Tell us about your background and teaching philosophy..."
                  />
                </div>
                <FormField 
                  label="GitHub Profile" 
                  name="github" 
                  type="url"
                  icon={<FiGithub />}
                  value={formData.github} 
                  onChange={handleChange} 
                  error={errors.github}
                  placeholder="https://github.com/username"
                />
                <FormField 
                  label="LinkedIn Profile" 
                  name="linkedin" 
                  type="url"
                  icon={<FiLinkedin />}
                  value={formData.linkedin} 
                  onChange={handleChange} 
                  error={errors.linkedin}
                  placeholder="https://linkedin.com/in/username"
                />
                <FormField 
                  label="Courses You Can Teach" 
                  name="coursesCanTeach" 
                  icon={<FiBookOpen />}
                  value={formData.coursesCanTeach} 
                  onChange={handleChange} 
                  error={errors.coursesCanTeach}
                  placeholder="React, Node.js, Python..."
                />
                <FormField 
                  label="CV / Portfolio Link" 
                  name="cvLink" 
                  type="url"
                  icon={<FiFileText />}
                  value={formData.cvLink} 
                  onChange={handleChange} 
                  error={errors.cvLink}
                  placeholder="Google Drive or Dropbox link"
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="submit-button">
                {isSubmitting ? "Processing..." : <><FiSend /> Submit Application</>}
              </button>
            </form>
          )}
        </div>
      </main>

      <style jsx>{`
        .instructor-page-wrapper {
          background: #0f172a;
          min-height: 100vh;
          color: #f1f5f9;
        }
        .form-main-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 120px 24px 60px; /* 120px top padding for fixed navbar */
        }
        .form-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .form-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 12px;
          background: linear-gradient(to right, #fff, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
          opacity: 0;
          animation: fadeInDown 0.8s ease forwards;
        }

        .form-header p {
          color: #94a3b8;
          font-size: 1.1rem;
        }
        .form-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }
        .success-mode {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }
        .success-animation {
          text-align: center;
          padding: 40px 0;
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .check-icon-wrapper {
          margin-bottom: 24px;
          animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .success-animation h2 {
          font-size: 2rem;
          color: #10b981;
          margin-bottom: 16px;
        }
        .success-animation p {
          color: #94a3b8;
          max-width: 400px;
          margin: 0 auto 32px;
          line-height: 1.6;
          font-size: 1.1rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .full-width {
          grid-column: span 2;
        }
        .submit-button {
          margin-top: 32px;
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          text-transform: uppercase;
        }
        .submit-button:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
        }
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .submit-button.secondary {
          background: transparent;
          border: 1px solid #334155;
        }
        .loading-viewport {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
        }

        /* Animations */
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes bounceIn { 
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .spinner {
          width: 40px;
          height: 40px;
          position: relative;
        }
        .spinner::before, .spinner::after {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #3b82f6;
        }
        .spinner::before {
          opacity: 0.2;
          border-color: #3b82f6;
        }
        .spinner::after {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .form-container-glass {
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
          border-top: 1px solid rgba(59, 130, 246, 0.3);
        }

        @media (max-width: 768px) {
          .form-grid { grid-template-columns: 1fr; }
          .full-width { grid-column: span 1; }
          .form-main-content { padding-top: 100px; }
          .form-card { padding: 24px; }
        }
      `}</style>
    </div>
  );
}

function FormField({ label, name, value, onChange, error, type = "text", isTextArea = false, icon, placeholder }: any) {
  return (
    <div className="field-container">
      <label htmlFor={name}>
        {icon} {label}
      </label>
      {isTextArea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={error ? "error" : ""}
          rows={4}
        />
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={error ? "error" : ""}
        />
      )}
      {error && <span className="error-text"><FiAlertCircle size={12} /> {error}</span>}
      <style jsx>{`
        .field-container { display: flex; flex-direction: column; gap: 10px; }
        label { font-size: 0.85rem; font-weight: 600; color: #94a3b8; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        input, textarea {
          padding: 14px 18px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(51, 65, 85, 0.8);
          border-radius: 12px;
          color: #f1f5f9;
          font-size: 0.95rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        textarea { resize: vertical; min-height: 120px; }
        input:focus, textarea:focus {
          outline: none;
          border-color: #3b82f6;
          background: #0f172a;
          transform: translateY(-1px);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        input.error, textarea.error { border-color: #ef4444; }
        .error-text { color: #fca5a5; font-size: 0.8rem; display: flex; align-items: center; gap: 4px; }
      `}</style>
    </div>
  );
}
