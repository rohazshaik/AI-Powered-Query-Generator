import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const FileUpload = ({ onUploadSuccess, onClose }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file) => {
        const validTypes = ['.csv', '.xlsx', '.xls', '.json', '.sql', '.db', '.sqlite'];
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(fileExt)) {
            setError('Invalid file type. Please upload CSV, Excel, JSON, or SQL database files.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File too large. Maximum size is 10MB.');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('http://localhost:8000/api/upload-data', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setUploadResult(response.data);
            setUploading(false);

            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed. Please try again.');
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-soft-xl max-w-2xl w-full border border-border-light dark:border-dark-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-dark-border">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
                        Upload Your Data
                    </h2>
                    <button
                        onClick={onClose}
                        className="btn-icon"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!uploadResult ? (
                        <>
                            {/* Drop Zone */}
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${dragActive
                                        ? 'border-accent-primary bg-accent-primary/5'
                                        : 'border-border-light dark:border-dark-border hover:border-accent-primary/50'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={handleChange}
                                    accept=".csv,.xlsx,.xls,.json,.sql,.db,.sqlite"
                                />

                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-accent-primary" />
                                        </div>

                                        <div>
                                            <p className="text-lg font-medium text-gray-900 dark:text-dark-text mb-1">
                                                {uploading ? 'Uploading...' : 'Drag & Drop your file here'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                                or click to browse
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-dark-text-secondary">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                <span>CSV, Excel, JSON, SQL DB</span>
                                            </div>
                                            <div>•</div>
                                            <div>Max 10MB</div>
                                        </div>
                                    </div>
                                </label>

                                {uploading && (
                                    <div className="absolute inset-0 bg-white/90 dark:bg-dark-bg/90 rounded-xl flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-gray-900 dark:text-dark-text font-medium">Processing file...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Success State */
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                                <div>
                                    <p className="text-green-700 dark:text-green-400 font-medium">Upload Successful!</p>
                                    <p className="text-green-600 dark:text-green-500 text-sm">
                                        {uploadResult.display_name} • {uploadResult.row_count} rows • {uploadResult.column_count} columns
                                    </p>
                                </div>
                            </div>

                            {/* Preview */}
                            <div>
                                <h3 className="text-gray-900 dark:text-dark-text font-medium mb-3">Data Preview</h3>
                                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 overflow-x-auto border border-border-light dark:border-dark-border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border-light dark:border-dark-border">
                                                {Object.keys(uploadResult.preview[0] || {}).map((col) => (
                                                    <th key={col} className="text-left p-2 text-accent-primary font-medium">
                                                        {col}
                                                        <span className="ml-2 text-xs text-gray-500 dark:text-dark-text-secondary font-normal">
                                                            ({uploadResult.schema[col]})
                                                        </span>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {uploadResult.preview.map((row, idx) => (
                                                <tr key={idx} className="border-b border-border-light/50 dark:border-dark-border/50">
                                                    {Object.values(row).map((val, i) => (
                                                        <td key={i} className="p-2 text-gray-700 dark:text-dark-text">
                                                            {val !== null ? String(val) : <span className="text-gray-400 dark:text-dark-text-secondary">null</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="btn-primary w-full"
                            >
                                Start Querying
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
