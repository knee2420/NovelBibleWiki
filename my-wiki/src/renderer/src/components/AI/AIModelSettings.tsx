
import { useState, useEffect } from 'react'
import { Save, RefreshCw, BarChart2, Key, Check, AlertCircle, CheckCircle2 } from 'lucide-react'
import { AI_MODELS } from '../../../../shared/const/ai-models'

export const AIModelSettings = () => {
    const [apiKey, setApiKey] = useState('')
    const [selectedModelId, setSelectedModelId] = useState('')
    const [usageStats, setUsageStats] = useState<Record<string, { requests: number, tokens: number }>>({})
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
             // @ts-ignore
             const [key, model, usage] = await Promise.all([
                 // @ts-ignore
                 window.api.getAIKey(),
                 // @ts-ignore
                 window.api.getAIModel(),
                 // @ts-ignore
                 window.api.getAIUsage()
             ])
             if (key) setApiKey(key)
             if (model) setSelectedModelId(model)
             if (usage) setUsageStats(usage)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            // @ts-ignore
            await window.api.saveAIKey(apiKey)
            // @ts-ignore
            await window.api.saveAIModel(selectedModelId)
            
            setMsg({ type: 'success', text: 'Settings saved!' })
            setTimeout(() => setMsg(null), 3000)
        } catch (e) {
            setMsg({ type: 'error', text: 'Failed to save settings' })
        } finally {
            setLoading(false)
        }
    }
    
    // Helper to calculate percentage
    const getUsagePercent = (current: number, max: number) => {
        if (!max) return 0
        const pct = (current / max) * 100
        return Math.min(pct, 100)
    }

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] p-6 text-slate-300 gap-8 overflow-y-auto w-full">
            
            {/* Header */}
            <div>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <BarChart2 className="text-purple-400" />
                     Model & Usage
                 </h2>
                 <p className="text-sm text-slate-500 mt-1">
                     Configure the AI Model and view simplified daily usage estimates.
                 </p>
            </div>

            {/* API Key Section */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Key size={14} /> Gemini API Key
                </label>
                <div className="flex gap-2">
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API Key..."
                        className="flex-1 bg-[#151515] border border-slate-700 rounded px-4 py-2 text-white focus:border-blue-500 focus:outline-none transision-colors font-mono text-sm"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Your key is stored locally. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-400 hover:underline">Google AI Studio</a>.
                </p>
            </div>

            {/* Model Selection */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Select Model
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AI_MODELS.map(model => (
                        <div 
                            key={model.id}
                            onClick={() => setSelectedModelId(model.id)}
                            className={`cursor-pointer p-4 rounded-lg border transition-all relative ${
                                selectedModelId === model.id 
                                ? 'bg-purple-500/10 border-purple-500 shadow-md shadow-purple-900/20' 
                                : 'bg-[#151515] border-slate-700 hover:border-slate-500'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`font-bold ${selectedModelId === model.id ? 'text-purple-300' : 'text-slate-300'}`}>
                                    {model.name}
                                </span>
                                {selectedModelId === model.id && <Check size={16} className="text-purple-500" />}
                            </div>
                            <div className="text-xs text-slate-500 flex flex-col gap-1">
                                <span>Limit: Is approx {model.limits.rpd} req/day</span>
                                <span>RPM: {model.limits.rpm}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Usage Charts */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex-1 min-h-[200px]">
                 <div className="flex justify-between items-center mb-6">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        Today's Usage Estimates
                    </label>
                    <button 
                        onClick={loadData}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                        title="Refresh Usage"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                 </div>

                 <div className="space-y-6">
                     {AI_MODELS.map(model => {
                         const stats = usageStats[model.id]
                         const requests = stats?.requests || 0
                         const tokens = stats?.tokens || 0
                         
                         const reqPercent = getUsagePercent(requests, model.limits.rpd)
                         const reqColor = reqPercent > 80 ? 'bg-red-500' : reqPercent > 50 ? 'bg-amber-500' : 'bg-green-500'

                         // Token visualization (Approximate since TPM is rate limit, not daily quota usually, but good to visualize scale)
                         // Let's us TPD limit if exists, otherwise show just count
                         return (
                            <div key={model.id} className="group border-b border-slate-800 pb-4 last:border-0">
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-sm font-medium ${selectedModelId === model.id ? 'text-purple-300' : 'text-slate-300'}`}>
                                        {model.name} {selectedModelId === model.id && '(Selected)'}
                                    </span>
                                </div>
                                
                                {/* Requests Bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500">Requests (Daily)</span>
                                        <span className="text-slate-400">
                                            {requests} / {model.limits.rpd}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[#151515] rounded-full overflow-hidden border border-slate-800">
                                        <div 
                                            className={`h-full ${reqColor} transition-all duration-500`} 
                                            style={{ width: `${reqPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Tokens Stat (Since TPM is transient, we just show total tokens used today) */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500">Tokens Processed (Today)</span>
                                        <span className="text-slate-400 font-mono">
                                            {tokens.toLocaleString()}
                                        </span>
                                    </div>
                                    {/* Optional: TPM Limit indicator */}
                                    <div className="text-[10px] text-slate-600 text-right">
                                        Limit: {model.limits.tpm.toLocaleString()} TPM / {model.limits.rpm} RPM
                                    </div>
                                </div>
                            </div>
                         )
                     })}
                     
                     {Object.keys(usageStats).length === 0 && (
                         <div className="text-center py-8 text-slate-600 italic text-sm">
                             No usage recorded for today yet.
                         </div>
                     )}
                 </div>
            </div>

            {/* Save Button Area (Sticky Bottom?) */}
            <div className="pt-4 flex justify-end">
                {msg && (
                    <span className={`mr-4 text-xs flex items-center gap-2 ${msg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {msg.type === 'success' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                        {msg.text}
                    </span>
                )}
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                    {loading ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16} />}
                    Apply Changes
                </button>
            </div>

        </div>
    )
}
