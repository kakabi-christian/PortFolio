import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MdEmail, MdLock, MdArrowForward, MdErrorOutline, MdCheckCircleOutline } from "react-icons/md";
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import { authService } from "../Services/AuthService";

export default function LoginContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-quart',
    });

    if (location.state?.message) {
      setMessage({ type: "success", text: location.state.message });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await authService.login(formData);
      if (response.user.role === 'admin') {
        navigate("/admin/type-documents");
      } else {
        navigate("/user/kyc"); 
      }
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 403 && data?.needs_verification) {
        navigate("/verify-otp", { 
          state: { email: formData.email, message: data.message } 
        });
      } else {
        const errorMsg = data?.message || "Identifiants incorrects ou problème réseau.";
        setMessage({ type: "error", text: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper d-flex align-items-center justify-content-center" 
         style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      
      <div className="login-card p-4 p-md-5 shadow-2xl rounded-5 border-0" 
            data-aos="zoom-in-up"
            style={{ 
              maxWidth: '450px', 
              width: '90%', 
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}>
        
        <div className="text-center mb-5" data-aos="fade-down" data-aos-delay="200">
          <h2 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)' }}>Bon retour !</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Accédez à votre espace d'administration <span className="fw-bold" style={{ color: 'var(--color-primary)' }}>Portfolio</span>
          </p>
        </div>

        {message && (
          <div className="d-flex align-items-center p-3 mb-4 rounded-4" 
                data-aos="fade"
                style={{ 
                  backgroundColor: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  borderLeft: `5px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
                  color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'
                }}>
            <span className="fs-4 me-3">
              {message.type === "success" ? <MdCheckCircleOutline /> : <MdErrorOutline />}
            </span>
            <span className="small fw-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="mb-4" data-aos="fade-up" data-aos-delay="400">
            <label htmlFor="login-email" className="form-label small fw-bold mb-2" style={{ color: 'var(--color-text-muted)' }}>Adresse Email</label>
            <div className="input-group">
              <span className="input-group-text border-0 px-3" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}><MdEmail /></span>
              <input 
                id="login-email"
                type="email" 
                className="form-control form-control-lg border-0 fs-6"
                style={{ 
                  borderRadius: '0 12px 12px 0', 
                  backgroundColor: 'var(--color-border)', 
                  color: 'var(--color-text-main)' 
                }}
                name="email" 
                placeholder="votre@email.com" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="mb-3" data-aos="fade-up" data-aos-delay="600">
            <div className="d-flex justify-content-between mb-2">
              <label htmlFor="login-password" className="form-label small fw-bold" style={{ color: 'var(--color-text-muted)' }}>Mot de passe</label>
              <Link to="/forgot-password" style={{ color: 'var(--color-primary)' }} className="small fw-bold text-decoration-none">
                Oublié ?
              </Link>
            </div>
            <div className="input-group">
              <span className="input-group-text border-0 px-3" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}><MdLock /></span>
              <input 
                id="login-password"
                type="password" 
                className="form-control form-control-lg border-0 fs-6"
                style={{ 
                  borderRadius: '0 12px 12px 0', 
                  backgroundColor: 'var(--color-border)', 
                  color: 'var(--color-text-main)' 
                }}
                name="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay="800">
            <button type="submit" 
                    className="btn w-100 mt-4 py-3 rounded-pill fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2" 
                    disabled={loading}
                    style={{ 
                      backgroundColor: 'var(--color-primary)', 
                      color: '#0f172a', 
                      border: 'none',
                      fontSize: '1rem',
                      height: '56px',
                      minHeight: '56px',
                      transition: 'background-color 0.2s'
                    }}>
              {loading ? (
                <span className="spinner-border spinner-border-sm" style={{ width: '1.2rem', height: '1.2rem' }}></span>
              ) : (
                <>Se connecter <MdArrowForward /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}