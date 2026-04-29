import { useState } from 'react';
import ValidateView from './views/ValidateView';
import GenerateView from './views/GenerateView';
import { Shield, Wand2 } from 'lucide-react';

type Tab = 'validate' | 'generate';

export default function App() {
  const [tab, setTab] = useState<Tab>('validate');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center h-14">
          <h1 className="text-lg font-bold text-gray-900 mr-8">Skill Workshop</h1>
          <nav className="flex gap-1">
            <button
              onClick={() => setTab('validate')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'validate'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shield size={16} />
              校验 Skill
            </button>
            <button
              onClick={() => setTab('generate')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'generate'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Wand2 size={16} />
              造 Skill
            </button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className={tab === 'validate' ? '' : 'hidden'}>
          <ValidateView />
        </div>
        <div className={tab === 'generate' ? '' : 'hidden'}>
          <GenerateView />
        </div>
      </main>
    </div>
  );
}
