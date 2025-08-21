import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Bot,
  Zap,
  Shield,
  Palette,
  Bell,
  Code,
  GitBranch,
  Settings as SettingsIcon
} from 'lucide-react';
import { aiService } from '../services/ai';

export const SettingsView: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Load existing API key on mount
  useEffect(() => {
    const existingKey = localStorage.getItem('claude-api-key');
    if (existingKey) {
      setApiKey(existingKey);
      setConnectionStatus('success');
    }
  }, []);

  const testConnection = async () => {
    if (!apiKey.trim()) return;

    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Initialize AI service with the key
      aiService.initialize(apiKey.trim());
      
      // Test the connection with a simple request
      await aiService.testConnection();
      
      setConnectionStatus('success');
    } catch (error) {
      console.error('API key test failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      if (apiKey.trim()) {
        localStorage.setItem('claude-api-key', apiKey.trim());
        
        // Test the connection first
        await testConnection();
        
        if (connectionStatus !== 'error') {
          setSavedAt(new Date());
        }
      } else {
        localStorage.removeItem('claude-api-key');
        setConnectionStatus('idle');
        setSavedAt(new Date());
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('claude-api-key');
    setConnectionStatus('idle');
    setSavedAt(new Date());
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-700 pb-6">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
          <SettingsIcon className="w-6 h-6" />
          <span>Settings</span>
        </h1>
        <p className="text-gray-400 mt-2">
          Configure your Reviewly experience and integrations
        </p>
      </div>

      {/* AI Configuration */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Configuration</h2>
            <p className="text-gray-400 text-sm">
              Connect your Claude API key to enable AI-powered code reviews
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Claude API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                  title={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {connectionStatus === 'success' && (
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Connected successfully</span>
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Connection failed</span>
                  </div>
                )}
                {connectionStatus === 'idle' && apiKey && (
                  <span className="text-sm text-gray-400">Not tested</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={testConnection}
                  disabled={!apiKey.trim() || isTestingConnection}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  {isTestingConnection ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>
                
                {apiKey && (
                  <button
                    onClick={clearApiKey}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* API Key Help */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-300 mb-1">How to get your Claude API key</h4>
                <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Visit <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-100">console.anthropic.com</a></li>
                  <li>Create an account or sign in</li>
                  <li>Navigate to API Keys in your account settings</li>
                  <li>Create a new API key and copy it here</li>
                </ol>
                <p className="text-xs text-blue-300 mt-2">
                  Your API key is stored locally in your browser and never sent to our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Review Preferences */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Review Preferences</h2>
            <p className="text-gray-400 text-sm">
              Customize how AI reviews analyze your code
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Review Categories */}
          <div>
            <h3 className="font-medium text-white mb-3">Analysis Categories</h3>
            <div className="space-y-3">
              {[
                { key: 'security', label: 'Security Issues', icon: Shield },
                { key: 'performance', label: 'Performance', icon: Zap },
                { key: 'style', label: 'Code Style', icon: Palette },
                { key: 'bugs', label: 'Potential Bugs', icon: AlertCircle },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center space-x-3 text-sm">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Review Sensitivity */}
          <div>
            <h3 className="font-medium text-white mb-3">Review Sensitivity</h3>
            <div className="space-y-3">
              {[
                { value: 'low', label: 'Low - Only critical issues' },
                { value: 'medium', label: 'Medium - Balanced approach' },
                { value: 'high', label: 'High - Comprehensive analysis' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center space-x-3 text-sm">
                  <input
                    type="radio"
                    name="sensitivity"
                    value={value}
                    defaultChecked={value === 'medium'}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Integration Settings */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">GitHub Integration</h2>
            <p className="text-gray-400 text-sm">
              Configure how Reviewly interacts with GitHub
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center space-x-3 text-sm">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-gray-300">Auto-review new pull requests</span>
          </label>
          
          <label className="flex items-center space-x-3 text-sm">
            <input
              type="checkbox"
              defaultChecked={false}
              className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-gray-300">Post AI suggestions as GitHub comments</span>
          </label>
          
          <label className="flex items-center space-x-3 text-sm">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-gray-300">Enable real-time notifications</span>
          </label>
        </div>
      </motion.section>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          {savedAt && (
            <span>Last saved: {savedAt.toLocaleTimeString()}</span>
          )}
        </div>
        
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all flex items-center space-x-2"
        >
          {isSaving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
};