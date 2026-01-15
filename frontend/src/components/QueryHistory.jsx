import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Clock, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'

export default function QueryHistory({ onLoadQuery }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const response = await axios.get('/api/history')
            setHistory(response.data)
        } catch (err) {
            console.error('Error fetching history:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="glass-card p-4">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-dark-700 rounded w-3/4"></div>
                    <div className="h-4 bg-dark-700 rounded w-1/2"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-dark-100">Recent Queries</h3>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-custom">
                <AnimatePresence>
                    {history.length > 0 ? (
                        history.map((item, index) => (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onLoadQuery(item)}
                                className="w-full text-left p-3 bg-dark-800/30 hover:bg-dark-800/50 border border-dark-700/30 hover:border-primary-500/50 rounded-lg transition-all duration-200 group"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <p className="text-sm text-dark-200 line-clamp-2 group-hover:text-primary-300 transition-colors">
                                        {item.question}
                                    </p>
                                    <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-primary-400 flex-shrink-0 transition-colors" />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-dark-500">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                    </span>
                                </div>
                            </motion.button>
                        ))
                    ) : (
                        <div className="text-center py-8 text-dark-500">
                            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No query history yet</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
