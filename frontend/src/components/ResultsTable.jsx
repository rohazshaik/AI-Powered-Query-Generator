import { motion } from 'framer-motion'
import { Table, CheckCircle2 } from 'lucide-react'

export default function ResultsTable({ columns, rows, rowCount }) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card overflow-hidden"
        >
            <div className="p-4 border-b border-dark-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Table className="w-5 h-5 text-primary-400" />
                    <h3 className="font-semibold text-dark-100">Query Results</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-dark-400">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>{rowCount} {rowCount === 1 ? 'row' : 'rows'}</span>
                </div>
            </div>

            <div className="overflow-x-auto scrollbar-custom">
                {rows.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-dark-800/50 border-b border-dark-700/50">
                                {columns.map((column, index) => (
                                    <th
                                        key={index}
                                        className="px-6 py-4 text-left text-xs font-semibold text-primary-400 uppercase tracking-wider"
                                    >
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700/30">
                            {rows.map((row, rowIndex) => (
                                <motion.tr
                                    key={rowIndex}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: rowIndex * 0.05 }}
                                    className="hover:bg-dark-800/30 transition-colors"
                                >
                                    {row.map((cell, cellIndex) => (
                                        <td
                                            key={cellIndex}
                                            className="px-6 py-4 text-sm text-dark-200 whitespace-nowrap"
                                        >
                                            {cell !== null && cell !== undefined ? String(cell) : (
                                                <span className="text-dark-500 italic">null</span>
                                            )}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-dark-400">No results found</p>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
