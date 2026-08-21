import { useEOC } from '../../context/EOCContext';
import { CheckCircle, AlertTriangle, HelpCircle, PhoneCall, HeartPulse } from 'lucide-react';
import { clsx } from 'clsx';

export const SafeVerifyModule = () => {
  const { safeVerifyRecords } = useEOC();

  const getStateStyles = (state: string) => {
    switch(state) {
      case 'SAFE': return { bg: 'bg-green-900/20 text-green-400 border-green-500/30', icon: CheckCircle };
      case 'ASSISTANCE': return { bg: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle };
      case 'TRAPPED': return { bg: 'bg-orange-900/20 text-orange-400 border-orange-500/30', icon: AlertTriangle };
      case 'MEDICAL': return { bg: 'bg-red-900/20 text-red-400 border-red-500/30', icon: HeartPulse };
      default: return { bg: 'bg-gray-800 text-on-surface-variant border-gray-700', icon: HelpCircle };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">SafeVerify Operations</h2>
          <p className="text-on-surface-variant text-sm mt-1">Rule: No-answer is NEVER interpreted as SAFE. All data originates from active verification.</p>
        </div>
      </div>

      <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-on-surface-variant">
          <thead className="bg-[#1f2937]/50 text-xs uppercase font-semibold text-on-surface-variant">
            <tr>
              <th className="px-6 py-4">Verify ID</th>
              <th className="px-6 py-4">Citizen / Reference</th>
              <th className="px-6 py-4">Campaign ID</th>
              <th className="px-6 py-4">Call ID</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Verified State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2937]">
            {safeVerifyRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  <PhoneCall size={32} className="mx-auto mb-3 opacity-20" />
                  No SafeVerify records generated yet. Run the IVR Simulator to generate live records.
                </td>
              </tr>
            ) : (
              safeVerifyRecords.map(record => {
                const styles = getStateStyles(record.state);
                const Icon = styles.icon;
                return (
                  <tr key={record.id} className="hover:bg-[#1f2937]/30">
                    <td className="px-6 py-4 font-sans text-white">{record.id}</td>
                    <td className="px-6 py-4 font-sans">{record.citizenPhone}</td>
                    <td className="px-6 py-4">{record.campaignId}</td>
                    <td className="px-6 py-4 font-sans text-xs">{record.callId}</td>
                    <td className="px-6 py-4">{new Date(record.timestamp).toLocaleTimeString()}</td>
                    <td className="px-6 py-4">
                      <span className={clsx("px-3 py-1 rounded-full border flex items-center gap-2 w-max text-xs font-bold", styles.bg)}>
                        <Icon size={14} /> {record.state}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
