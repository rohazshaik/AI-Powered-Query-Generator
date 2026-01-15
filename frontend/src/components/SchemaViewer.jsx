import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, ChevronDown, ChevronRight, Key, RefreshCw } from 'lucide-react'
import axios from 'axios'

export default function SchemaViewer({ refreshTrigger }) {
    const [schema, setSchema] = useState(null)
    const [sampleData, setSampleData] = useState(null)
    const [expandedTables, setExpandedTables] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSchema = async () => {
            setLoading(true)
            try {
                // Use active-schema endpoint to get schema for current database
                const [schemaRes, sampleRes] = await Promise.all([
                    axios.get('/api/active-schema'),
                    axios.get('/api/sample-data').catch(() => ({ data: {} })) // Sample data might not exist for uploaded DBs
                ])
                setSchema(schemaRes.data.tables)
                setSampleData(sampleRes.data)

                // Expand first table by default
                const firstTable = Object.keys(schemaRes.data.tables)[0]
                if (firstTable) {
                    setExpandedTables({ [firstTable]: true })
                }
            } catch (err) {
                console.error('Error fetching schema:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchSchema()
    }, [refreshTrigger]) // Re-fetch when refreshTrigger changes

    const toggleTable = (tableName) => {
        setExpandedTables(prev => ({
            ...prev,
            [tableName]: !prev[tableName]
        }))
    }

    const getTableCount = (tableName) => {
        if (!sampleData) return null
        const countMap = {
            'products': sampleData.products_count,
            'customers': sampleData.customers_count,
            'orders': sampleData.orders_count
        }
        return countMap[tableName]
    }

    if (loading) {
        return (
            <div className="glass-card p-6">
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
                <Database className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-dark-100">Database Schema</h3>
            </div>

            <div className="space-y-2">
                {schema && Object.entries(schema).map(([tableName, columns]) => (
                    <div key={tableName} className="border border-dark-700/50 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleTable(tableName)}
                            className="w-full px-3 py-2.5 bg-dark-800/30 hover:bg-dark-800/50 transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-2">
                                {expandedTables[tableName] ? (
                                    <ChevronDown className="w-4 h-4 text-dark-400" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-dark-400" />
                                )}
                                <span className="font-medium text-dark-200 group-hover:text-primary-400 transition-colors">
                                    {tableName}
                                </span>
                            </div>
                            {getTableCount(tableName) !== null && (
                                <span className="text-xs text-dark-500 bg-dark-700/50 px-2 py-1 rounded">
                                    {getTableCount(tableName)} rows
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {expandedTables[tableName] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-3 space-y-2 bg-dark-900/20">
                                        {columns.map((column, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-dark-800/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {column.isPrimaryKey && (
                                                        <Key className="w-3 h-3 text-yellow-400" />
                                                    )}
                                                    <span className="text-dark-300 font-mono text-xs">
                                                        {column.name}
                                                    </span>
                                                </div>
                                                <span className="text-dark-500 text-xs font-mono">
                                                    {column.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    )
}
