import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Copy, Check, Loader2, Info } from 'lucide-react'
import Editor from '@monaco-editor/react'

export default function SQLDisplay({ sql, explanation, onExecute, isExecuting }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(sql)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleExecute = () => {
        if (!isExecuting) {
            onExecute(sql)
        }
    }

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card overflow-hidden"
        >
            <div className="p-4 border-b border-dark-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <h3 className="font-semibold text-dark-100">Generated SQL Query</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-2 hover:bg-dark-800 rounded-lg transition-colors text-dark-300 hover:text-primary-400"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="bg-dark-950/50">
                <Editor
                    height="200px"
                    defaultLanguage="sql"
                    value={sql}
                    theme="vs-dark"
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 },
                    }}
                />
            </div>

            {explanation && (
                <div className="p-4 bg-dark-800/30 border-t border-dark-700/50 flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-dark-300">{explanation}</p>
                </div>
            )}

            <div className="p-4 border-t border-dark-700/50">
                <button
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isExecuting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Executing Query...
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5" />
                            Execute Query
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    )
}
