import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function QueryInput({ question, setQuestion, onGenerate, isGenerating }) {
    const exampleQueries = [
        "Show me all products in the Electronics category",
        "What are the top 5 most expensive products?",
        "Show me all orders from customers in New York",
        "Count how many products are in each category"
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (question.trim() && !isGenerating) {
            onGenerate(question);
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a question about your data..."
                        className="input w-full min-h-[100px] text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-text-secondary"
                        disabled={isGenerating}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!question.trim() || isGenerating}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating SQL...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Generate SQL Query
                        </>
                    )}
                </button>
            </form>

            {/* Example Queries */}
            <div className="pt-4 border-t border-border-light dark:border-dark-border">
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-3">Try:</p>
                <div className="flex flex-wrap gap-2">
                    {exampleQueries.map((example, index) => (
                        <button
                            key={index}
                            onClick={() => setQuestion(example)}
                            disabled={isGenerating}
                            className="text-xs px-3 py-1.5 rounded-lg border border-border-light dark:border-dark-border 
                                     hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors
                                     text-gray-600 dark:text-dark-text-secondary disabled:opacity-50"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
