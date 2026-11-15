import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import BrandWorkspace from './pages/BrandWorkspace';
import CreateEditBrand from './pages/CreateEditBrand';
import ContentSubmission from './pages/ContentSubmission';
import ReviewResults from './pages/ReviewResults';
import ReviewHistory from './pages/ReviewHistory';
import Settings from './pages/Settings';
import { api } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [preselectedBrandId, setPreselectedBrandId] = useState(null);
  const [editBrandId, setEditBrandId] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Parse location hash for state persistence across browser refreshes
  const parseHash = () => {
    const rawHash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [page, query] = rawHash.split('?');
    const params = new URLSearchParams(query || '');
    return {
      page: page || 'dashboard',
      reviewId: params.get('id') ? Number(params.get('id')) : null,
      brandId: params.get('brandId') ? Number(params.get('brandId')) : null,
    };
  };

  useEffect(() => {
    // Initial sync from URL hash
    const syncFromHash = () => {
      const { page, reviewId, brandId } = parseHash();
      if (page) setCurrentPage(page);
      if (reviewId) setSelectedReviewId(reviewId);
      if (page === 'review' && brandId) setPreselectedBrandId(brandId);
      if (page === 'edit-brand' && brandId) setEditBrandId(brandId);
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    checkHealth();

    const interval = setInterval(checkHealth, 30000);
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      clearInterval(interval);
    };
  }, []);

  async function checkHealth() {
    try {
      const data = await api.getHealth();
      setSystemHealth(data);
    } catch (err) {
      setSystemHealth({ status: 'offline', ai_engine_mode: 'Backend Connecting...' });
    }
  }

  const navigateTo = (page, reviewId = null, brandId = null) => {
    let hashStr = `#/${page}`;
    if (reviewId) hashStr += `?id=${reviewId}`;
    else if (brandId) hashStr += `?brandId=${brandId}`;
    window.location.hash = hashStr;
    setCurrentPage(page);
    setSelectedReviewId(reviewId);
    if (page === 'edit-brand') {
      setEditBrandId(brandId);
    } else {
      setEditBrandId(null);
    }
    if (page === 'review') {
      setPreselectedBrandId(brandId);
    }
  };

  const triggerToast = (toastObj) => {
    setToast(toastObj);
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seedBrands();
      triggerToast({
        type: 'success',
        title: 'Demo Brands Seeded',
        message: res.message || 'Successfully preloaded demo brands and rules.'
      });
      checkHealth();
    } catch (err) {
      triggerToast({ type: 'error', title: 'Seeding Error', message: err.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const pageHeaders = {
    dashboard: {
      title: 'Governance Dashboard',
      subtitle: 'Real-time overview of content compliance, review statuses, and brand integrity.'
    },
    brands: {
      title: 'Brand Workspace',
      subtitle: 'Centralized registry of company brand profiles, tone guidelines, and approved facts.'
    },
    'create-brand': {
      title: 'Configure Brand Profile',
      subtitle: 'Define brand rules, tone attributes, compliance constraints, and banned words.'
    },
    'edit-brand': {
      title: 'Edit Brand Profile',
      subtitle: 'Modify brand configuration, tone attributes, guidelines, and terminology rules.'
    },
    review: {
      title: 'Content Submission',
      subtitle: 'Submit marketing drafts, email copies, or ad creative for compliance review.'
    },
    results: {
      title: 'Review Results & Correction Workflow',
      subtitle: 'Inspect detected compliance issues, evaluate supporting evidence, and accept suggestions.'
    },
    history: {
      title: 'Review Audit History',
      subtitle: 'Searchable log of all submitted content reviews and human approval decisions.'
    },
    settings: {
      title: 'System & Team Information',
      subtitle: 'Platform diagnostics, responsible AI safeguards, and engineering team credits.'
    }
  };

  const currentHeader = pageHeaders[currentPage] || { title: 'BrandGuard AI', subtitle: '' };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={(page) => navigateTo(page)}
        systemHealth={systemHealth}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={currentHeader.title}
          subtitle={currentHeader.subtitle}
          onNewReview={currentPage !== 'review' ? () => navigateTo('review') : null}
          onSeedDemo={handleSeedDemo}
          systemHealth={systemHealth}
          isSeeding={isSeeding}
        />

        <main className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigate={(page) => navigateTo(page)}
              onSelectReview={(id) => navigateTo('results', id)}
              triggerToast={triggerToast}
            />
          )}

          {currentPage === 'brands' && (
            <BrandWorkspace
              onNavigate={(page) => navigateTo(page)}
              onSelectBrandForReview={(bId) => navigateTo('review', null, bId)}
              onEditBrand={(bId) => navigateTo('edit-brand', null, bId)}
              triggerToast={triggerToast}
            />
          )}

          {(currentPage === 'create-brand' || currentPage === 'edit-brand') && (
            <CreateEditBrand
              editBrandId={editBrandId}
              onNavigate={(page) => navigateTo(page)}
              triggerToast={triggerToast}
            />
          )}

          {currentPage === 'review' && (
            <ContentSubmission
              preselectedBrandId={preselectedBrandId}
              onReviewSubmitted={(id) => navigateTo('results', id)}
              onNavigate={(page) => navigateTo(page)}
              triggerToast={triggerToast}
            />
          )}

          {currentPage === 'results' && (
            <ReviewResults
              reviewId={selectedReviewId}
              onNavigate={(page) => navigateTo(page)}
              triggerToast={triggerToast}
            />
          )}

          {currentPage === 'history' && (
            <ReviewHistory
              onSelectReview={(id) => navigateTo('results', id)}
              onNavigate={(page) => navigateTo(page)}
              triggerToast={triggerToast}
            />
          )}

          {currentPage === 'settings' && (
            <Settings
              systemHealth={systemHealth}
              onRefreshHealth={checkHealth}
              triggerToast={triggerToast}
            />
          )}
        </main>
      </div>

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
