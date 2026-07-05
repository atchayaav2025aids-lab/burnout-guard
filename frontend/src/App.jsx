import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import Cleaning from './pages/Cleaning';
import EDA from './pages/EDA';
import MLPrediction from './pages/MLPrediction';
import Visualizations from './pages/Visualizations';
import Reports from './pages/Reports';
import EmployeeDetails from './pages/EmployeeDetails';
import HistoryPage from './pages/History';
import SettingsPage from './pages/Settings';

const BACKEND_URL = window.location.port === '5173' ? 'http://localhost:8000' : window.location.origin;

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem("stress_token") || null);
  const [username, setUsername] = useState(sessionStorage.getItem("stress_username") || null);
  const [currentPage, setCurrentPage] = useState('landing');
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") !== "light");
  
  // App variables
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [uploadData, setUploadData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  
  // Pipeline loads
  const [isCleaning, setIsCleaning] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Auto-login verify
  useEffect(() => {
    if (token) {
      // Validate session with backend
      fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) {
          setCurrentPage('dashboard');
        } else {
          // Token expired or invalid
          handleLogout();
        }
      })
      .catch(() => {
        // Server offline or network issue
        setCurrentPage('dashboard');
      });
    }
  }, [token]);

  // Handle HTML document dark theme classes
  useEffect(() => {
    const root = document.getElementById('root');
    if (isDarkMode) {
      document.documentElement.classList.add('theme-dark');
      document.body.classList.add('theme-dark');
      if (root) root.classList.add('theme-dark');
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove('theme-dark');
      document.body.classList.remove('theme-dark');
      if (root) root.classList.remove('theme-dark');
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const handleLoginSuccess = (usr, tok) => {
    setToken(tok);
    setUsername(usr);
    addNotification("Authentication Successful", "Logged in to HR portal.");
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem("stress_token");
    sessionStorage.removeItem("stress_username");
    setToken(null);
    setUsername(null);
    setActiveDatasetId(null);
    setUploadData(null);
    setAnalysisData(null);
    setCurrentPage('landing');
  };

  // Notification helper
  const addNotification = (title, details) => {
    const time_str = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setNotifications(prev => [{ title, time: time_str }, ...prev]);
  };

  const handleUploadSuccess = (datasetId, rawData) => {
    setActiveDatasetId(datasetId);
    setUploadData(rawData);
    addNotification("Dataset Uploaded", `Successfully parsed: ${rawData.filename}`);
    setCurrentPage('cleaning');
  };

  const handleProceedToAnalyze = async () => {
    if (!activeDatasetId) return;
    setIsCleaning(true);
    addNotification("Data Cleaning Triggered", "Starting duplicate checks, missing values imputation, and scaling.");

    try {
      // Call backend analyze
      const response = await fetch(`${BACKEND_URL}/api/analyze?dataset_id=${activeDatasetId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Analysis pipeline failed.");
      }

      setAnalysisData(data);
      addNotification("ML Classification Complete", `Trained models. Best model: ${data.summary.model_name}`);
      setCurrentPage('dashboard');
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred during ML training.");
    } finally {
      setIsCleaning(false);
    }
  };

  // Load a dataset from history or dashboard
  const handleLoadDataset = async (datasetId, targetPage = 'dashboard') => {
    try {
      // 1. Fetch raw dataset metadata & preview
      const responseMeta = await fetch(`${BACKEND_URL}/api/upload/${datasetId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const metaData = await responseMeta.json();
      if (!responseMeta.ok) {
        alert(metaData.detail || "Could not load dataset.");
        return;
      }
      
      // Successfully retrieved dataset metadata
      setActiveDatasetId(datasetId);
      setUploadData(metaData);
      
      // 2. Fetch associated analysis (if available)
      const responseAnalysis = await fetch(`${BACKEND_URL}/api/history/${datasetId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (responseAnalysis.ok) {
        const analysis = await responseAnalysis.json();
        setAnalysisData(analysis);
        addNotification("Dataset Loaded Successfully", `Loaded cohort: ${metaData.filename}`);
      } else {
        // Analysis does not exist yet for this dataset
        setAnalysisData(null);
        addNotification("Dataset Loaded Successfully", `Cohort: ${metaData.filename} (Pending Analysis)`);
      }
      
      setCurrentPage(targetPage);
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while loading the dataset.");
    }
  };

  // Auth pages view routing
  const isAuthPage = ['landing', 'login', 'signup', 'forgot_password'].includes(currentPage);
  if (!token && isAuthPage) {
    if (currentPage === 'login') {
      return <Login onLoginSuccess={handleLoginSuccess} onNavigate={setCurrentPage} backendUrl={BACKEND_URL} />;
    }
    if (currentPage === 'signup') {
      return <SignUp onSignUpSuccess={handleLoginSuccess} onNavigate={setCurrentPage} backendUrl={BACKEND_URL} />;
    }
    if (currentPage === 'forgot_password') {
      return <ForgotPassword onNavigate={setCurrentPage} backendUrl={BACKEND_URL} />;
    }
    return <LandingPage onNavigate={setCurrentPage} />;
  }

  // Fallback to login if token is missing and accessing protected views
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} onNavigate={setCurrentPage} backendUrl={BACKEND_URL} />;
  }

  return (
    <div className={`theme-${isDarkMode ? 'dark' : 'light'} app-container flex`}>
      {/* Left Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Right Content Panel */}
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <TopBar 
          username={username} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          onLogout={handleLogout}
          notifications={notifications}
        />

        {/* Outer scroll area */}
        <main className="flex-grow overflow-y-auto bg-[var(--bg-primary)] text-[var(--text-primary)]">
          
          {currentPage === 'dashboard' && (
            <Dashboard 
              backendUrl={BACKEND_URL} 
              token={token} 
              onNavigate={setCurrentPage}
              onSelectDataset={handleLoadDataset}
              activeDatasetId={activeDatasetId}
              uploadData={uploadData}
              onAnalyzeNow={handleProceedToAnalyze}
            />
          )}

          {currentPage === 'upload' && (
            <UploadPage 
              backendUrl={BACKEND_URL} 
              token={token} 
              onUploadSuccess={handleUploadSuccess} 
            />
          )}

          {currentPage === 'cleaning' && (
            <Cleaning 
              uploadData={uploadData} 
              isCleaning={isCleaning} 
              onProceedToAnalyze={handleProceedToAnalyze}
            />
          )}

           {currentPage === 'eda' && (
            <EDA 
              activeDatasetId={activeDatasetId}
              analysisData={analysisData} 
              onAnalyzeNow={handleProceedToAnalyze}
            />
          )}

          {currentPage === 'predict' && (
            <MLPrediction 
              activeDatasetId={activeDatasetId}
              analysisData={analysisData} 
              onAnalyzeNow={handleProceedToAnalyze}
            />
          )}

          {currentPage === 'visualizations' && (
            <Visualizations 
              activeDatasetId={activeDatasetId}
              analysisData={analysisData} 
              onAnalyzeNow={handleProceedToAnalyze}
              isDarkMode={isDarkMode}
            />
          )}

          {currentPage === 'reports' && (
            <Reports 
              datasetId={activeDatasetId} 
              backendUrl={BACKEND_URL} 
              token={token} 
              analysisData={analysisData}
              onAnalyzeNow={handleProceedToAnalyze}
            />
          )}

          {currentPage === 'employee_details' && (
            <EmployeeDetails 
              activeDatasetId={activeDatasetId}
              uploadData={uploadData}
              analysisData={analysisData} 
              onAnalyzeNow={handleProceedToAnalyze}
            />
          )}

          {currentPage === 'history' && (
            <HistoryPage 
              backendUrl={BACKEND_URL} 
              token={token} 
              onSelectDataset={handleLoadDataset}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage 
              username={username}
              token={token}
              backendUrl={BACKEND_URL}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          )}

        </main>
      </div>
    </div>
  );
}
