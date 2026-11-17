import { useState, useEffect } from 'react';
import type { Problem, User } from './types/problem';
import { apiService } from './services/api';
import { Navbar } from './components/Navbar';
import { ProblemList } from './components/ProblemList';
import { ProblemWorkspace } from './components/ProblemWorkspace';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { Spinner } from './components/ui/spinner';

export function App() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(apiService.getStoredUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProblems = async (query?: string) => {
    try {
      const activeQuery = query !== undefined ? query : searchQuery;
      const data = await apiService.getProblems(activeQuery);
      setProblems(data);

      // Check if URL has a hash for specific problem, e.g. #two-sum or #1
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace('#', '').toLowerCase();
        const found = data.find(
          (p) => p.slug.toLowerCase() === hash || p.id === hash
        );
        if (found) {
          setSelectedProblem(found);
        }
      }
    } catch (e) {
      console.error('Failed to load problems', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    loadProblems(query);
  };

  useEffect(() => {
    loadProblems();
    // Validate current token
    apiService.getMe().then((u) => {
      setUser(u);
    });

    const handleHashChange = () => {
      if (window.location.hash) {
        const hash = window.location.hash.replace('#', '').toLowerCase();
        const found = problems.find(
          (p) => p.slug.toLowerCase() === hash || p.id === hash
        );
        if (found) {
          setSelectedProblem(found);
          setIsAdminView(false);
        }
      } else {
        setSelectedProblem(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setIsAdminView(false);
    if (typeof window !== 'undefined') {
      window.location.hash = problem.slug || problem.id;
    }
  };

  const handleBackToProblemList = () => {
    setSelectedProblem(null);
    if (typeof window !== 'undefined' && window.location.hash) {
      window.location.hash = '';
    }
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
    setIsAdminView(false);
    loadProblems();
  };

  const handleAuthSuccess = (u: User) => {
    setUser(u);
    loadProblems();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b] text-zinc-100 font-sans">
      <Navbar
        user={user}
        onNavigateHome={() => {
          handleBackToProblemList();
          setIsAdminView(false);
        }}
        onOpenAdmin={() => {
          setSelectedProblem(null);
          setIsAdminView(true);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        isAdminView={isAdminView}
        activeProblemTitle={selectedProblem ? `${selectedProblem.id}. ${selectedProblem.title}` : undefined}
      />

      <main className="flex-1 flex flex-col overflow-auto">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-zinc-400">
              <Spinner size="lg" />
              <p className="text-sm">Loading AlgoPlace catalog...</p>
            </div>
          </div>
        ) : isAdminView && user?.role === 'admin' ? (
          <AdminPanel
            problems={problems}
            onBack={() => setIsAdminView(false)}
            onRefresh={loadProblems}
          />
        ) : selectedProblem ? (
          <ProblemWorkspace
            problem={selectedProblem}
            problems={problems}
            isLoggedIn={!!user}
            onRequireAuth={() => setShowAuthModal(true)}
            onBack={handleBackToProblemList}
            onSelectProblem={handleSelectProblem}
          />
        ) : (
          <ProblemList
            problems={problems}
            onSelectProblem={handleSelectProblem}
            onSearchChange={handleSearchChange}
          />
        )}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
