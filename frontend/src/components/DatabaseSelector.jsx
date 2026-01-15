import React, { useState, useEffect } from 'react';
import { Database, ChevronDown, Trash2, Check } from 'lucide-react';
import axios from 'axios';

const DatabaseSelector = ({ onDatabaseChange }) => {
    const [databases, setDatabases] = useState([]);
    const [activeDb, setActiveDb] = useState('default');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchDatabases = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/databases');
            setDatabases(response.data.databases);
            setActiveDb(response.data.active);
        } catch (error) {
            console.error('Failed to fetch databases:', error);
        }
    };

    useEffect(() => {
        fetchDatabases();
        const interval = setInterval(fetchDatabases, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSwitch = async (dbName) => {
        setLoading(true);
        try {
            await axios.post(`http://localhost:8000/api/switch-database?db_name=${dbName}`);
            setActiveDb(dbName);
            setIsOpen(false);

            if (onDatabaseChange) {
                onDatabaseChange(dbName);
            }
        } catch (error) {
            console.error('Failed to switch database:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, tableName) => {
        e.stopPropagation();

        if (!confirm(`Delete "${tableName.replace('_', ' ')}"? This cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8000/api/delete-upload/${tableName}`);
            await fetchDatabases();
        } catch (error) {
            console.error('Failed to delete database:', error);
        }
    };

    const activeDatabase = databases.find(db => db.name === activeDb);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-bg-secondary border border-border-light dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
                <Database className="w-4 h-4 text-gray-600 dark:text-dark-text-secondary" />
                <div className="flex flex-col items-start min-w-[140px]">
                    <span className="text-xs text-gray-500 dark:text-dark-text-secondary">Active Database</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                        {activeDatabase?.display_name || 'Default (E-commerce)'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-dark-bg-secondary border border-border-light dark:border-dark-border rounded-lg shadow-md-light z-50 overflow-hidden">
                        <div className="p-3 border-b border-border-light dark:border-dark-border">
                            <p className="text-xs text-gray-600 dark:text-dark-text-secondary">
                                Select a database to query
                            </p>
                        </div>

                        <div className="max-h-96 overflow-y-auto scrollbar-custom">
                            {databases.map((db) => (
                                <button
                                    key={db.name}
                                    onClick={() => handleSwitch(db.name)}
                                    disabled={loading}
                                    className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors ${db.active ? 'bg-gray-50 dark:bg-dark-bg-tertiary' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-2 h-2 rounded-full ${db.active ? 'bg-accent-primary' : 'bg-gray-300 dark:bg-dark-border'
                                            }`} />

                                        <div className="flex flex-col items-start">
                                            <span className={`text-sm font-medium ${db.active ? 'text-accent-primary' : 'text-gray-900 dark:text-dark-text'
                                                }`}>
                                                {db.display_name}
                                            </span>
                                            {db.type === 'uploaded' && (
                                                <span className="text-xs text-gray-500 dark:text-dark-text-secondary">
                                                    {db.row_count} rows • {db.column_count} columns
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {db.active && (
                                            <Check className="w-4 h-4 text-accent-primary" />
                                        )}

                                        {db.type === 'uploaded' && (
                                            <button
                                                onClick={(e) => handleDelete(e, db.name)}
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors group/delete"
                                                title="Delete database"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover/delete:text-red-500" />
                                            </button>
                                        )}
                                    </div>
                                </button>
                            ))}

                            {databases.length === 1 && (
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                        No uploaded databases yet
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-dark-border mt-1">
                                        Upload a CSV or Excel file to get started
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DatabaseSelector;
