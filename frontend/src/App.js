import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  const analyzeWebsite = async () => {
    if (!url) {
      setError('Please enter a website URL');
      return;
    }

    // Automatically add https:// if no protocol is specified
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
      setUrl(processedUrl); // Update the input field to show the full URL
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: processedUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    // Clear any previous errors when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      analyzeWebsite();
    }
  };

  const getCategoryColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCategoryBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ScoreCircle = ({ score, size = 'large' }) => {
    const radius = size === 'large' ? 45 : 30;
    const strokeWidth = size === 'large' ? 8 : 6;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className={`relative ${size === 'large' ? 'w-32 h-32' : 'w-20 h-20'}`}>
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ${getCategoryColor(score)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${size === 'large' ? 'text-3xl' : 'text-lg'} font-bold text-gray-700`}>
            {score}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Website Analysis Tool
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get comprehensive AI-powered insights to improve your website's performance, SEO, 
            user experience, and more. Discover optimization opportunities and AI integration strategies.
          </p>
        </div>

        {/* URL Input */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <label className="text-lg font-semibold text-gray-700">Website URL</label>
            </div>
            <div className="flex gap-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                disabled={loading}
              />
              <button
                onClick={analyzeWebsite}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </div>
                ) : (
                  'Analyze Website'
                )}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Analyzing website... This may take a moment.</p>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* AI Readiness Score Section */}
            {analysis.ai_readiness_score && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">AI Readiness Score</h2>
                    <p className="text-gray-600 mt-1">How ready is your website for AI integration compared to industry standards</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* AI Score Display */}
                  <div className="text-center lg:border-r lg:border-gray-200 lg:pr-8">
                    <div className="mb-6">
                      <ScoreCircle score={analysis.ai_readiness_score.overall_ai_score} />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 font-medium">AI Readiness</div>
                      <div className="text-3xl font-bold text-gray-800">{analysis.ai_readiness_score.overall_ai_score}/100</div>
                      <div className={`text-sm font-medium px-3 py-1 rounded-full inline-flex items-center ${
                        analysis.ai_readiness_score.overall_ai_score >= 80 ? 'bg-green-100 text-green-700' : 
                        analysis.ai_readiness_score.overall_ai_score >= 65 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {analysis.ai_readiness_score.ai_readiness_level}
                      </div>
                    </div>
                  </div>
                  
                  {/* Industry Comparison */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Industry Comparison
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Your Score</span>
                          <span className="font-bold text-indigo-600">{analysis.ai_readiness_score.overall_ai_score}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Industry Average</span>
                          <span className="font-bold text-gray-600">{analysis.ai_readiness_score.industry_average}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Performance</span>
                          <span className={`font-bold ${
                            analysis.ai_readiness_score.performance_vs_industry >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {analysis.ai_readiness_score.performance_vs_industry >= 0 ? '+' : ''}{analysis.ai_readiness_score.performance_vs_industry}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Category: {analysis.ai_readiness_score.industry_category}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Factors */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 mb-4">AI Readiness Factors</h3>
                    {Object.entries(analysis.ai_readiness_score.ai_factors).map(([factor, data]) => (
                      <div key={factor} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">{factor.replace('_', ' ')}</span>
                          <span className={`text-sm font-bold ${data.score >= 80 ? 'text-green-600' : data.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {data.score}/100
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{data.description}</p>
                        <p className="text-xs font-medium text-blue-600">{data.improvement}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Overview */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Analysis Overview</h2>
                  <p className="text-gray-600 mt-1">Comprehensive analysis of your website's performance</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Overall Score Section */}
                <div className="text-center lg:border-r lg:border-gray-200 lg:pr-8">
                  <div className="mb-6">
                    <ScoreCircle score={analysis.overall_score} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 font-medium">Overall Score</div>
                    <div className="text-3xl font-bold text-gray-800">{analysis.overall_score}/100</div>
                    <div className={`text-sm font-medium px-3 py-1 rounded-full inline-flex items-center ${analysis.overall_score >= 80 ? 'bg-green-100 text-green-700' : analysis.overall_score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {analysis.overall_score >= 80 ? 'Excellent' : analysis.overall_score >= 60 ? 'Good' : 'Needs Improvement'}
                    </div>
                  </div>
                </div>
                
                {/* Website Details Section */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16" />
                        </svg>
                        Website Title
                      </h3>
                      <p className="text-gray-700 font-medium text-lg leading-relaxed">{analysis.title}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Description
                      </h3>
                      <p className="text-gray-700 font-medium leading-relaxed">{analysis.description || 'No description available'}</p>
                    </div>
                  </div>
                  
                  {/* URL Display */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Analyzed URL
                    </h3>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-blue-600 font-medium break-all">{analysis.url}</p>
                    </div>
                  </div>
                  
                  {/* Content Summary */}
                  {analysis.content_summary && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Content Summary
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-lg">{analysis.content_summary}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Scores */}
            {analysis.categories && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Category Scores</h2>
                    <p className="text-gray-600 mt-1">Detailed breakdown of your website's performance metrics</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {Object.entries(analysis.categories).map(([category, data]) => (
                    <div key={category} className={`relative overflow-hidden rounded-xl border-2 ${getCategoryBgColor(data.score)} transition-all hover:shadow-lg hover:scale-105 transform duration-300`}>
                      <div className="p-6">
                        <div className="text-center mb-4">
                          <ScoreCircle score={data.score} size="small" />
                          <h3 className="font-bold text-gray-800 capitalize mt-3 text-lg">{category}</h3>
                        </div>
                        {data.key_issues && (
                          <div className="space-y-3">
                            <div className="border-t border-gray-200 pt-4">
                              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <svg className="w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                Key Issues
                              </h4>
                              <div className="space-y-2">
                                {data.key_issues.slice(0, 3).map((issue, index) => (
                                  <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-start">
                                      <span className="text-red-400 mr-2 mt-1 flex-shrink-0">•</span>
                                      <span className="text-sm text-gray-700 font-medium">{issue}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Score indicator at the bottom */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 ${data.score >= 80 ? 'bg-green-500' : data.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Improvement Suggestions</h2>
                  <p className="text-gray-600 mt-1">Actionable recommendations to enhance your website</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {analysis.suggestions?.map((suggestion, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-blue-600 transition-colors">{suggestion.title}</h3>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {suggestion.category}
                          </span>
                        </div>
                      </div>
                      <span className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${getPriorityColor(suggestion.priority)} shadow-sm`}>
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-6 leading-relaxed">{suggestion.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center mb-2">
                          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-700">Impact</span>
                        </div>
                        <span className={`text-lg font-bold ${suggestion.impact === 'High' ? 'text-green-600' : suggestion.impact === 'Medium' ? 'text-yellow-600' : 'text-blue-600'}`}>
                          {suggestion.impact}
                        </span>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center mb-2">
                          <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-700">Effort</span>
                        </div>
                        <span className={`text-lg font-bold ${suggestion.effort === 'Low' ? 'text-green-600' : suggestion.effort === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                          {suggestion.effort}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Tools Integration */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">AI Tools Integration</h2>
                  <p className="text-gray-600 mt-1">Recommended AI solutions to enhance your website</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {analysis.ai_tools_integration?.map((tool, index) => (
                  <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-purple-600 transition-colors">{tool.tool_name}</h3>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {tool.category}
                          </span>
                        </div>
                      </div>
                      <span className={`px-4 py-2 text-sm font-bold rounded-full ${getComplexityColor(tool.integration_complexity)} border shadow-sm`}>
                        {tool.integration_complexity}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-6 leading-relaxed">{tool.description}</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span className="text-sm font-bold text-gray-700">Expected Impact</span>
                          </div>
                          <span className="text-lg font-bold text-green-600">{tool.expected_impact}</span>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-bold text-gray-700">Use Case</span>
                          </div>
                          <p className="text-gray-700 font-medium">{tool.use_case}</p>
                        </div>
                        
                        {/* Learn More Section */}
                        {tool.learn_more_url && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span className="text-sm font-bold text-gray-700">Learn More</span>
                              </div>
                              <a 
                                href={tool.learn_more_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                              >
                                Visit Site
                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                            {tool.provider_examples && (
                              <div>
                                <p className="text-xs text-gray-600 mb-2">Popular Providers:</p>
                                <div className="flex flex-wrap gap-2">
                                  {tool.provider_examples.map((provider, providerIndex) => (
                                    <span key={providerIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                      {provider}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {tool.implementation_steps && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
                            <h4 className="font-bold text-gray-800 flex items-center">
                              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              Implementation Steps
                            </h4>
                          </div>
                          <div className="p-4">
                            <ol className="list-decimal list-inside space-y-3">
                              {tool.implementation_steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="text-sm text-gray-700 leading-relaxed p-2 bg-gray-50 rounded-lg border border-gray-200">
                                  <span className="font-medium">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta Analysis */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h2 className="text-3xl font-bold text-gray-800">SEO Meta Analysis</h2>
              </div>
              {analysis.meta_analysis && (
                <div className="space-y-8">
                  {/* Current Meta Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2" />
                        </svg>
                        Current Meta Title
                      </h3>
                      <p className="text-sm text-gray-700 mb-3 bg-white p-3 rounded-lg border">{analysis.meta_analysis.current_meta_title}</p>
                      <div className="flex items-center text-xs text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Length: {analysis.meta_analysis.meta_title_analysis?.length || 0} characters
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Current Meta Description
                      </h3>
                      <p className="text-sm text-gray-700 mb-3 bg-white p-3 rounded-lg border">
                        {analysis.meta_analysis.current_meta_description || 'No meta description found'}
                      </p>
                      <div className="flex items-center text-xs text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Length: {analysis.meta_analysis.meta_description_analysis?.length || 0} characters
                      </div>
                    </div>
                  </div>

                  {/* Analysis Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-800">Meta Title Analysis</h3>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getCategoryColor(analysis.meta_analysis.meta_title_analysis?.seo_score || 70)}`}>
                            {analysis.meta_analysis.meta_title_analysis?.seo_score || 70}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Issues:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {analysis.meta_analysis.meta_title_analysis?.issues?.map((issue, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-red-400 mr-2 mt-1">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-blue-800 mb-1">Suggestions:</h4>
                          <p className="text-sm text-blue-700">{analysis.meta_analysis.meta_title_analysis?.suggestions}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-800">Meta Description Analysis</h3>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getCategoryColor(analysis.meta_analysis.meta_description_analysis?.seo_score || 70)}`}>
                            {analysis.meta_analysis.meta_description_analysis?.seo_score || 70}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Issues:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {analysis.meta_analysis.meta_description_analysis?.issues?.map((issue, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-red-400 mr-2 mt-1">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="text-sm font-medium text-purple-800 mb-1">Suggestions:</h4>
                          <p className="text-sm text-purple-700">{analysis.meta_analysis.meta_description_analysis?.suggestions}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEO Strategy Insights */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      SEO Strategy Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.meta_analysis.seo_strategy_insights?.map((insight, index) => (
                        <div key={index} className="flex items-start bg-white p-4 rounded-lg border border-gray-200">
                          <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Recommended Meta Title
                      </h3>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-700 font-medium">{analysis.meta_analysis.recommended_meta_title}</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Recommended Meta Description
                      </h3>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-700 font-medium">{analysis.meta_analysis.recommended_meta_description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recommended Tools */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <h2 className="text-3xl font-bold text-gray-800">Recommended Tools</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {analysis.tools_recommended?.map((tool, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-gray-800 text-lg">{tool.tool_name}</h3>
                      <span className="text-sm text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{tool.description}</p>
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <h4 className="text-sm font-medium text-indigo-800 mb-2">Use Case:</h4>
                      <p className="text-sm text-indigo-700">{tool.use_case}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;