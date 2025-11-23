import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const logs: string[] = [];

    try {
      // Test 1: Check Supabase client
      logs.push('✓ Supabase client created');

      // Test 2: Try to query teachers table
      logs.push('Testing: Querying teachers table...');
      const { data: teachersData, error: teachersError, count: teachersCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact' });

      if (teachersError) {
        logs.push(`✗ Teachers table error: ${teachersError.message}`);
      } else {
        logs.push(`✓ Teachers table exists. Found ${teachersCount || 0} teachers`);
      }

      // Test 3: Try to query students table
      logs.push('Testing: Querying students table...');
      const { data: studentsData, error: studentsError, count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact' });

      if (studentsError) {
        logs.push(`✗ Students table error: ${studentsError.message}`);
      } else {
        logs.push(`✓ Students table exists. Found ${studentsCount || 0} students`);
      }

      // Test 4: Try to query student_progress table
      logs.push('Testing: Querying student_progress table...');
      const { error: progressError, count: progressCount } = await supabase
        .from('student_progress')
        .select('*', { count: 'exact' });

      if (progressError) {
        logs.push(`✗ Student_progress table error: ${progressError.message}`);
      } else {
        logs.push(`✓ Student_progress table exists. Found ${progressCount || 0} records`);
      }

      // Test 5: Try to query reading_logs table
      logs.push('Testing: Querying reading_logs table...');
      const { error: logsError, count: logsCount } = await supabase
        .from('reading_logs')
        .select('*', { count: 'exact' });

      if (logsError) {
        logs.push(`✗ Reading_logs table error: ${logsError.message}`);
      } else {
        logs.push(`✓ Reading_logs table exists. Found ${logsCount || 0} records`);
      }

      logs.push('Diagnostics complete!');
    } catch (err) {
      logs.push(`✗ Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    }

    setDiagnostics(logs);
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">Supabase Diagnostics</h1>
        
        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition duration-200 mb-6"
        >
          {testing ? 'Testing...' : 'Run Diagnostics'}
        </button>

        {diagnostics.length > 0 && (
          <div className="bg-gray-100 rounded-lg p-6 font-mono text-sm space-y-2">
            {diagnostics.map((log, idx) => (
              <div
                key={idx}
                className={log.startsWith('✓') ? 'text-green-700' : log.startsWith('✗') ? 'text-red-700' : 'text-gray-700'}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
