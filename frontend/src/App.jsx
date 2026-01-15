import { useState, useEffect } from 'react'
import { Sun, Moon, Database, Upload, Play, Copy, Check } from 'lucide-react'
import QueryInput from './components/QueryInput'
import SQLDisplay from './components/SQLDisplay'
import ResultsTable from './components/ResultsTable'
import SchemaViewer from './components/SchemaViewer'
import FileUpload from './components/FileUpload'
import DatabaseSelector from './components/DatabaseSelector'
import axios from 'axios'

function App() {
    const [question, setQuestion] = useState('')
    const [sqlQuery, setSqlQuery] = useState('')
    const [explanation, setExplanation] = useState('')
    const [results, setResults] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)
    const [error, setError] = useState(null)
    const [showUpload, setShowUpload] = useState(false)
    const [activeDatabase, setActiveDatabase] = useState('default')
    const [schemaRefresh, setSchemaRefresh] = useState(0)
    const [darkMode, setDarkMode] = useState(false)

    // Dark mode toggle
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    const handleGenerateSQL = async (userQuestion) => {
        setIsGenerating(true)
        setError(null)
        setSqlQuery('')
        setExplanation('')
        setResults(null)

        try {
            const response = await axios.post('/api/generate-sql', {
                question: userQuestion
            })

            setSqlQuery(response.data.sql)
            setExplanation(response.data.explanation)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to generate SQL query')
            console.error('Error generating SQL:', err)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleExecuteQuery = async (sql) => {
        setIsExecuting(true)
        setError(null)

        try {
            const response = await axios.post('/api/execute-query', {
                sql: sql
            })

            setResults(response.data)

            // Save to history
            try {
                await axios.post('/api/history', {
                    question: question,
                    sql: sql
                })
            } catch (historyErr) {
                console.error('Failed to save history:', historyErr)
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to execute query')
            console.error('Error executing query:', err)
        } finally {
            setIsExecuting(false)
        }
    }

    const handleUploadSuccess = (uploadData) => {
        setShowUpload(false)
        setActiveDatabase(uploadData.table_name)
        setSqlQuery('')
        setResults(null)
        setError(null)
        setSchemaRefresh(prev => prev + 1)
    }

    const handleDatabaseChange = (dbName) => {
        setActiveDatabase(dbName)
        setSqlQuery('')
        setResults(null)
        setError(null)
        setSchemaRefresh(prev => prev + 1)
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-dark-bg transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-border-light dark:border-dark-border">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent-primary rounded-lg flex items-center justify-center">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Text-to-SQL</h1>
                                <p className="text-xs text-gray-500 dark:text-dark-text-secondary">AI-Powered Query Generator</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <DatabaseSelector onDatabaseChange={handleDatabaseChange} />
                            <button
                                onClick={() => setShowUpload(true)}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                <span className="hidden sm:inline">Upload Data</span>
                            </button>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="btn-icon"
                                aria-label="Toggle dark mode"
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Sidebar - Schema */}
                    <div className="lg:col-span-1">
                        <div className="card sticky top-24">
                            <SchemaViewer refreshTrigger={schemaRefresh} />
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Query Input Section */}
                        <section className="card">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
                                Ask a Question
                            </h2>
                            <QueryInput
                                question={question}
                                setQuestion={setQuestion}
                                onGenerate={handleGenerateSQL}
                                isGenerating={isGenerating}
                            />
                        </section>

                        {/* Error Display */}
                        {error && (
                            <div className="card bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* SQL Display Section */}
                        {sqlQuery && (
                            <section className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                                        Generated SQL
                                    </h2>
                                </div>
                                <SQLDisplay
                                    sql={sqlQuery}
                                    explanation={explanation}
                                    onExecute={handleExecuteQuery}
                                    isExecuting={isExecuting}
                                />
                            </section>
                        )}

                        {/* Results Section */}
                        {results && (
                            <section className="card">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
                                    Query Results
                                </h2>
                                <ResultsTable
                                    columns={results.columns}
                                    rows={results.rows}
                                    rowCount={results.row_count}
                                />
                            </section>
                        )}

                        {/* Empty State */}
                        {!sqlQuery && !isGenerating && (
                            <div className="card text-center py-12">
                                <Database className="w-16 h-16 mx-auto text-gray-300 dark:text-dark-border mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">
                                    Ready to Query
                                </h3>
                                <p className="text-gray-500 dark:text-dark-text-secondary mb-6">
                                    Enter a natural language question to generate SQL
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                                    {[
                                        "Show all products in Electronics",
                                        "Top 5 most expensive products",
                                        "Orders from New York customers",
                                        "Count products by category"
                                    ].map((example, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuestion(example)}
                                            className="text-left p-3 rounded-lg border border-border-light dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors text-sm text-gray-600 dark:text-dark-text-secondary"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* File Upload Modal */}
            {showUpload && (
                <FileUpload
                    onUploadSuccess={handleUploadSuccess}
                    onClose={() => setShowUpload(false)}
                />
            )}
        </div>
    )
}

export default App
