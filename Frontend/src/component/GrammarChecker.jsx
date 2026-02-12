// Frontend/src/components/GrammarChecker.jsx
import { useState } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, X, Copy, Check } from 'lucide-react';
import { checkGrammar } from '../lib/ai-api';
import toast from 'react-hot-toast';

const GrammarChecker = ({ text, onCorrectedText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCheck = async () => {
    if (!text || text.trim().length === 0) {
      toast.error('Please enter some text first');
      return;
    }

    setIsChecking(true);
    setIsOpen(true);

    try {
      const grammarResult = await checkGrammar(text);
      setResult(grammarResult);
      
      if (!grammarResult.hasMistakes) {
        toast.success('Perfect! No errors found 🎉');
      }
    } catch (error) {
      console.error('Grammar check error:', error);
      toast.error('Failed to check grammar');
      setIsOpen(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopy = () => {
    if (result?.correctedText) {
      navigator.clipboard.writeText(result.correctedText);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseCorrection = () => {
    if (result?.correctedText && onCorrectedText) {
      onCorrectedText(result.correctedText);
      toast.success('Text corrected!');
      setIsOpen(false);
      setResult(null);
    }
  };

  return (
    <>
      {/* Grammar Check Button */}
      <button
        onClick={handleCheck}
        disabled={!text || isChecking}
        className="btn btn-ghost btn-sm gap-2"
        title="Check grammar with AI"
      >
        <Sparkles size={16} className={isChecking ? 'animate-spin' : ''} />
        {isChecking ? 'Checking...' : 'Check Grammar'}
      </button>

      {/* Grammar Results Modal */}
      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="text-primary" size={20} />
                Grammar Check Results
              </h3>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setResult(null);
                }}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X size={20} />
              </button>
            </div>

            {isChecking ? (
              <div className="flex flex-col items-center justify-center py-8">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 text-base-content/60">Analyzing your text...</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Overall Status */}
                <div className={`alert ${result.hasMistakes ? 'alert-warning' : 'alert-success'}`}>
                  {result.hasMistakes ? (
                    <AlertCircle size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                  <span>{result.overallFeedback}</span>
                </div>

                {/* Original vs Corrected */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Text */}
                  <div className="space-y-2">
                    <p className="font-semibold text-sm text-base-content/70">Original:</p>
                    <div className="p-3 bg-base-200 rounded-lg">
                      <p className="text-sm">{text}</p>
                    </div>
                  </div>

                  {/* Corrected Text */}
                  <div className="space-y-2">
                    <p className="font-semibold text-sm text-base-content/70">Corrected:</p>
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                      <p className="text-sm">{result.correctedText}</p>
                    </div>
                  </div>
                </div>

                {/* Mistakes List */}
                {result.hasMistakes && result.mistakes.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-semibold text-sm">Corrections ({result.mistakes.length}):</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {result.mistakes.map((mistake, index) => (
                        <div 
                          key={index} 
                          className="p-3 bg-base-200 rounded-lg border-l-4 border-warning"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-error line-through">
                                  {mistake.original}
                                </span>
                                <span className="text-xs text-base-content/40">→</span>
                                <span className="text-xs font-semibold text-success">
                                  {mistake.correction}
                                </span>
                              </div>
                              <p className="text-xs text-base-content/70">
                                {mistake.explanation}
                              </p>
                            </div>
                            <span className="badge badge-sm badge-outline">
                              {mistake.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <button 
                    onClick={handleCopy}
                    className="btn btn-outline btn-sm gap-2"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  
                  {onCorrectedText && result.hasMistakes && (
                    <button 
                      onClick={handleUseCorrection}
                      className="btn btn-primary btn-sm gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Use Correction
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <div className="modal-backdrop" onClick={() => setIsOpen(false)}></div>
        </div>
      )}
    </>
  );
};

export default GrammarChecker;